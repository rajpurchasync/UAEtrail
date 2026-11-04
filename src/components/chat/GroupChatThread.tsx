import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Settings2, Users } from 'lucide-react';
import { groupsApi, messagingApi } from '../../messaging';
import type {
  SocialGroupMemberView,
  SocialGroupView,
  SocialGroupWallMessageView,
} from '../../api/types';
import { ChatReplyComposer } from './ChatReplyComposer';
import { useThreadReply } from './useThreadReply';
import { ChatThreadShell } from './ChatThreadShell';
import { ChatThreadHeaderBar } from './ChatThreadHeaderBar';
import {
  canMemberPostToGroupWall,
  groupWallPostPolicyLabel,
  resolveGroupWallPostPolicy,
} from '../../utils/groupWallPostPolicy';
import { GroupWallChatSettingsSheet } from './GroupWallChatSettingsSheet';
import { GroupWallMembersSheet } from './GroupWallMembersSheet';
import { useAuth } from '../../context/AuthContext';
import { GroupWallMessageItem } from './GroupWallMessageItem';
import { MessageAvatar } from './ChatMessageAvatar';
import { chatMessageRowAlign } from './chatMessageLayout';
import {
  createOptimisticChatId,
  isOptimisticChatId,
  replaceOptimisticChatRow,
} from '../../utils/chatOptimistic';
import { wallMessageQuoteSnippet } from '../../utils/groupWallReply';

import { ChatThreadLoadMore } from './ChatThreadLoadMore';
import { ChatLoadingState } from './ChatLoadingState';
import {
  CHAT_THREAD_INITIAL_LIMIT,
  CHAT_THREAD_MANUAL_OLDER_LIMIT,
  shouldShowChatLoadMore,
} from '../../utils/chatThreadPagination';
import { groupChatWallQueryKey } from '../../hooks/clientQueryKeys';
import {
  type GroupChatWallCache,
  groupWallMessagesMatchGroup,
  mergeChatRowsById,
} from '../../utils/chatThreadCache';
import {
  applyChatScrollPreserveAnchor,
  captureChatScrollPreserveAnchor,
  chatMessageAnchorSelector,
} from '../../utils/chatScrollPreserve';

/** Fallback when SSE is unavailable; primary delivery is `group_wall_message` on chat stream. */
const WALL_POLL_MS = 45_000;

type WallScrollMode = 'initial' | 'bottom' | 'preserve';

export type GroupChatActivityPayload = {
  groupId: string;
  body: string;
  createdAt: string;
};

/** @deprecated Use {@link GroupChatActivityPayload} */
export type GroupWallActivityPayload = GroupChatActivityPayload;

type GroupChatThreadProps = {
  groupId: string;
  onBack: () => void;
  onGroupActivity?: (payload: GroupChatActivityPayload) => void;
  streamedMessage?: SocialGroupWallMessageView | null;
  onStreamedMessageApplied?: () => void;
  onGroupUpdated?: (group: SocialGroupView) => void;
};

export const GroupChatThread = ({
  groupId,
  onBack,
  onGroupActivity,
  streamedMessage,
  onStreamedMessageApplied,
  onGroupUpdated,
}: GroupChatThreadProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentUserId = user?.id;
  const [group, setGroup] = useState<SocialGroupView | null>(null);
  const [membership, setMembership] = useState<SocialGroupMemberView | null>(null);
  const [members, setMembers] = useState<SocialGroupMemberView[]>([]);
  const [wall, setWall] = useState<SocialGroupWallMessageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const {
    replyTo,
    setReplyTo,
    clearReply,
    highlightMessageId,
    scrollContainerRef: chatContainerRef,
    scrollToMessage: scrollToWallMessage,
  } = useThreadReply(groupId, 'data-wall-message-id');
  const skipScrollRef = useRef(true);
  const wallLengthRef = useRef(0);
  const wallLatestAtRef = useRef<string | null>(null);
  const scrollModeRef = useRef<WallScrollMode>('initial');
  const preserveScrollAnchorRef = useRef<ReturnType<typeof captureChatScrollPreserveAnchor>>(null);
  const preparedGroupRef = useRef<string | null>(null);
  if (preparedGroupRef.current !== groupId) {
    preparedGroupRef.current = groupId;
    skipScrollRef.current = true;
    wallLengthRef.current = 0;
    wallLatestAtRef.current = null;
    scrollModeRef.current = 'initial';
    preserveScrollAnchorRef.current = null;
  }

  const canPost =
    group && membership ? canMemberPostToGroupWall(group, membership) : false;
  const isAdmin = membership?.role === 'admin';
  const postPolicy = group ? resolveGroupWallPostPolicy(group) : 'all_members';

  const notifyWallActivity = useCallback(
    (message: Pick<SocialGroupWallMessageView, 'body' | 'createdAt'>) => {
      onGroupActivity?.({ groupId, body: message.body, createdAt: message.createdAt });
    },
    [groupId, onGroupActivity]
  );

  const markWallRead = useCallback(() => {
    void messagingApi.crew.markWallRead(groupId).catch(() => undefined);
  }, [groupId]);

  const mergeWall = useCallback((incoming: SocialGroupWallMessageView[]) => {
    scrollModeRef.current = 'initial';
    const ordered = [...incoming];
    setWall((current) => {
      const lastCurrent = current[current.length - 1];
      const lastOrdered = ordered[ordered.length - 1];
      if (current.length === ordered.length && lastCurrent?.id === lastOrdered?.id) {
        return current;
      }
      return ordered;
    });
  }, []);

  const prependWallMessages = useCallback((incoming: SocialGroupWallMessageView[]) => {
    if (incoming.length === 0) return;
    scrollModeRef.current = 'preserve';
    setWall((current) => {
      const ids = new Set(current.map((row) => row.id));
      const prepended = incoming.filter((message) => !ids.has(message.id));
      if (prepended.length === 0) return current;
      return [...prepended, ...current];
    });
  }, []);

  const appendWallMessages = useCallback((incoming: SocialGroupWallMessageView[]) => {
    if (incoming.length === 0) return;
    scrollModeRef.current = 'bottom';
    setWall((current) => {
      const ids = new Set(current.map((row) => row.id));
      const merged = [...current];
      for (const message of incoming) {
        if (ids.has(message.id)) continue;
        if (currentUserId && message.authorUserId === currentUserId) {
          const pendingIndex = merged.findIndex(
            (row) =>
              isOptimisticChatId(row.id) &&
              row.authorUserId === currentUserId &&
              row.body === message.body
          );
          if (pendingIndex >= 0) {
            const pendingId = merged[pendingIndex].id;
            merged[pendingIndex] = message;
            ids.delete(pendingId);
            ids.add(message.id);
            continue;
          }
        }
        merged.push(message);
        ids.add(message.id);
      }
      return merged;
    });
  }, [currentUserId]);

  const appendWallMessage = useCallback((message: SocialGroupWallMessageView) => {
    appendWallMessages([message]);
  }, [appendWallMessages]);

  useEffect(() => {
    const last = wall[wall.length - 1];
    wallLatestAtRef.current = last?.createdAt ?? null;
  }, [wall]);

  const loadThread = useCallback(async () => {
    const wallKey = groupChatWallQueryKey(groupId);
    const cached = queryClient.getQueryData<GroupChatWallCache>(wallKey);
    const hasWallCache = Boolean(cached?.messages.length);

    if (hasWallCache && cached) {
      setWall(cached.messages);
      setHasMoreOlder(cached.hasMoreOlder);
      setLoading(false);
      scrollModeRef.current = 'initial';
      skipScrollRef.current = true;
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [detailRes, wallRes] = await Promise.all([
        groupsApi.getMeGroupDetail(groupId),
        messagingApi.crew.getWall(groupId, { limit: CHAT_THREAD_INITIAL_LIMIT }),
      ]);
      setGroup(detailRes.data.group);
      setMembership(detailRes.data.membership);
      setMembers(detailRes.data.members);
      const serverMore =
        wallRes.meta?.hasMoreOlder ?? wallRes.data.length >= CHAT_THREAD_INITIAL_LIMIT;
      if (hasWallCache && cached) {
        setWall(mergeChatRowsById(cached.messages, wallRes.data));
        setHasMoreOlder(cached.hasMoreOlder || serverMore);
      } else {
        setHasMoreOlder(serverMore);
        mergeWall(wallRes.data);
      }
      markWallRead();
      const latest = wallRes.data[wallRes.data.length - 1];
      if (latest) notifyWallActivity(latest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load group chat.');
      if (!hasWallCache) {
        setWall([]);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, markWallRead, mergeWall, notifyWallActivity, queryClient]);

  const pollNewMessages = useCallback(async () => {
    const since = wallLatestAtRef.current;
    if (!since) return;
    try {
      const wallRes = await messagingApi.crew.getWall(groupId, { since });
      if (wallRes.data.length === 0) return;
      appendWallMessages(wallRes.data);
      skipScrollRef.current = false;
      markWallRead();
      const latest = wallRes.data[wallRes.data.length - 1];
      if (latest) notifyWallActivity(latest);
    } catch {
      /* poll is best-effort */
    }
  }, [appendWallMessages, groupId, markWallRead, notifyWallActivity]);

  const loadOlderMessages = useCallback(
    async (limit: number) => {
      if (loadingOlder || !hasMoreOlder || wall.length === 0) return;
      const first = wall.find((row) => !isOptimisticChatId(row.id));
      if (!first) return;
      preserveScrollAnchorRef.current = captureChatScrollPreserveAnchor(
        chatContainerRef.current,
        chatMessageAnchorSelector(chatContainerRef.current, 'data-wall-message-id')
      );
      setLoadingOlder(true);
      try {
        const wallRes = await messagingApi.crew.getWall(groupId, {
          beforeMessageId: first.id,
          limit,
        });
        if (wallRes.data.length === 0) {
          setHasMoreOlder(false);
          return;
        }
        prependWallMessages(wallRes.data);
        setHasMoreOlder(wallRes.meta?.hasMoreOlder ?? wallRes.data.length >= limit);
      } catch {
        /* history load is best-effort */
      } finally {
        setLoadingOlder(false);
      }
    },
    [chatContainerRef, groupId, hasMoreOlder, loadingOlder, prependWallMessages, wall]
  );

  const showLoadMore = shouldShowChatLoadMore(wall.length, hasMoreOlder);

  const loadMoreManual = useCallback(() => {
    void loadOlderMessages(CHAT_THREAD_MANUAL_OLDER_LIMIT);
  }, [loadOlderMessages]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (!groupWallMessagesMatchGroup(wall, groupId)) return;
    queryClient.setQueryData<GroupChatWallCache>(groupChatWallQueryKey(groupId), {
      messages: wall,
      hasMoreOlder,
    });
  }, [groupId, hasMoreOlder, queryClient, wall]);

  useEffect(() => {
    setHasMoreOlder(false);
  }, [groupId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void pollNewMessages();
    }, WALL_POLL_MS);
    return () => window.clearInterval(id);
  }, [pollNewMessages]);

  useEffect(() => {
    if (!streamedMessage || streamedMessage.groupId !== groupId) return;
    appendWallMessages([streamedMessage]);
    skipScrollRef.current = false;
    markWallRead();
    notifyWallActivity(streamedMessage);
    onStreamedMessageApplied?.();
  }, [
    appendWallMessages,
    groupId,
    markWallRead,
    notifyWallActivity,
    onStreamedMessageApplied,
    streamedMessage,
  ]);

  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    if (!container || loading) return;

    const anchor = preserveScrollAnchorRef.current;
    const grew = wall.length > wallLengthRef.current;

    if (anchor) {
      if (grew) {
        applyChatScrollPreserveAnchor(container, anchor);
        preserveScrollAnchorRef.current = null;
        wallLengthRef.current = wall.length;
        scrollModeRef.current = 'bottom';
      } else if (!loadingOlder) {
        preserveScrollAnchorRef.current = null;
      }
      return;
    }

    const mode = scrollModeRef.current;
    scrollModeRef.current = 'bottom';

    wallLengthRef.current = wall.length;

    if (mode === 'initial' || skipScrollRef.current) {
      skipScrollRef.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (grew && mode === 'bottom') {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatContainerRef, wall.length, loading, loadingOlder]);

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !canPost || !currentUserId) return;
    setDraft('');
    setError(null);

    const replyToMessageId = replyTo?.id;
    const quoted = replyToMessageId ? wall.find((row) => row.id === replyToMessageId) : undefined;
    const optimisticId = createOptimisticChatId();
    const optimistic: SocialGroupWallMessageView = {
      id: optimisticId,
      groupId,
      authorUserId: currentUserId,
      body: trimmed,
      createdAt: new Date().toISOString(),
      ...(replyToMessageId ? { replyToMessageId } : {}),
      ...(quoted
        ? {
            replyToPreview: {
              messageId: quoted.id,
              authorDisplayName: quoted.author?.displayName?.trim() || 'Member',
              bodySnippet: wallMessageQuoteSnippet(quoted.body),
            },
          }
        : {}),
    };

    appendWallMessage(optimistic);
    skipScrollRef.current = false;
    notifyWallActivity(optimistic);

    const previousReply = replyTo;
    setReplyTo(null);

    try {
      const res = await messagingApi.crew.post(groupId, trimmed, {
        replyToMessageId,
      });
      setWall((current) => replaceOptimisticChatRow(current, optimisticId, res.data));
      skipScrollRef.current = false;
      markWallRead();
      notifyWallActivity(res.data);
    } catch (err) {
      setWall((current) => current.filter((row) => row.id !== optimisticId));
      setDraft(trimmed);
      setReplyTo(previousReply);
      setError(err instanceof Error ? err.message : 'Could not send message.');
    }
  };

  const updateMessageReactions = (messageId: string, reactions: SocialGroupWallMessageView['reactions']) => {
    setWall((current) =>
      current.map((message) => (message.id === messageId ? { ...message, reactions } : message))
    );
  };

  const resolveQuotedMessage = useCallback(
    (messageId: string) => {
      const quoted = wall.find((m) => m.id === messageId);
      if (!quoted) return null;
      const authorName = quoted.author?.displayName?.trim() || 'Member';
      return { authorName, body: quoted.body };
    },
    [wall]
  );

  const activeMemberCount = members.filter((m) => m.memberType === 'adult' && m.isActive !== false).length;
  const title = group?.name || 'Group chat';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
    <ChatThreadShell
      error={error}
      scrollContainerRef={chatContainerRef}
      scrollVariant="group"
      header={
        <ChatThreadHeaderBar
          onBack={onBack}
          backLabel="Back to chat list"
          backVisibility="mobile-only"
          titleButton={{ onClick: () => setMembersOpen(true) }}
          leading={
            group?.photoUrl ? (
              <MessageAvatar name={title} url={group.photoUrl} />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Users className="h-5 w-5" aria-hidden />
              </div>
            )
          }
          title={title}
          subtitle={
            loading && !group ? (
              'Loading chat…'
            ) : (
            <>
              {activeMemberCount} participant{activeMemberCount === 1 ? '' : 's'} ·{' '}
              {groupWallPostPolicyLabel[postPolicy]}
            </>
            )
          }
          trailing={
            isAdmin ? (
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Chat settings"
              >
                <Settings2 className="h-5 w-5" />
              </button>
            ) : null
          }
        />
      }
      footer={
        canPost ? (
          <ChatReplyComposer
            replyTo={replyTo}
            onCancelReply={clearReply}
            showQuoteSnippet={false}
            value={draft}
            onChange={setDraft}
            onSend={sendMessage}
            composeClassName="!border-t-0 !px-4"
          />
        ) : (
          <div className="shrink-0 border-t bg-neutral-50 px-4 py-3 text-center text-xs text-neutral-600">
            {groupWallPostPolicyLabel[postPolicy]}. You can still read messages and react.
          </div>
        )
      }
    >
        {loading ? (
          <ChatLoadingState variant="thread" label="Loading messages" />
        ) : wall.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
            <p className="text-sm font-medium text-neutral-700">No messages yet</p>
            <p className="mt-1 text-xs text-neutral-500">
              {canPost ? 'Say hello to the crew.' : 'Admins can post updates here.'}
            </p>
          </div>
        ) : (
          <>
            {showLoadMore ? (
              <ChatThreadLoadMore loading={loadingOlder} onClick={loadMoreManual} />
            ) : loadingOlder ? (
              <p className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-neutral-500" role="status">
                Loading earlier messages
              </p>
            ) : null}
            {wall.map((message) => {
              const isMe = Boolean(currentUserId && message.authorUserId === currentUserId);
              return (
                <div key={message.id} className={chatMessageRowAlign(isMe)}>
                  <GroupWallMessageItem
                    groupId={groupId}
                    message={message}
                    isMe={isMe}
                    highlighted={highlightMessageId === message.id}
                    replyEnabled={canPost}
                    onReactionsChange={updateMessageReactions}
                    onReply={setReplyTo}
                    onScrollToQuotedMessage={scrollToWallMessage}
                    resolveQuotedMessage={resolveQuotedMessage}
                    onError={setError}
                  />
                </div>
              );
            })}
          </>
        )}
    </ChatThreadShell>

    {group ? (
      <>
        <GroupWallMembersSheet
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
          group={group}
          members={members}
        />
        <GroupWallChatSettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          group={group}
          onUpdated={(updated) => {
            setGroup(updated);
            onGroupUpdated?.(updated);
          }}
          onError={setError}
        />
      </>
    ) : null}
    </div>
  );
};
