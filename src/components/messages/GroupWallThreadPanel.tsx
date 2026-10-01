import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MessageSquare, Settings2, Users, X } from 'lucide-react';
import { api } from '../../api/index';
import type { SocialGroupMemberView, SocialGroupView, SocialGroupWallMessageView } from '../../api/index';
import { ChatComposeBar } from '../ui/ChatComposeBar';
import {
  canMemberPostToGroupWall,
  groupWallPostPolicyLabel,
  resolveGroupWallPostPolicy,
} from '../../utils/groupWallPostPolicy';
import { GroupWallChatSettingsSheet } from './GroupWallChatSettingsSheet';
import { GroupWallMembersSheet } from './GroupWallMembersSheet';
import {
  formatGroupWallReplyBody,
  GroupWallMessageItem,
  type GroupWallReplyTarget,
} from './GroupWallMessageItem';

const WALL_POLL_MS = 12_000;

type GroupWallThreadPanelProps = {
  groupId: string;
  onBack: () => void;
};

export const GroupWallThreadPanel = ({ groupId, onBack }: GroupWallThreadPanelProps) => {
  const [group, setGroup] = useState<SocialGroupView | null>(null);
  const [membership, setMembership] = useState<SocialGroupMemberView | null>(null);
  const [members, setMembers] = useState<SocialGroupMemberView[]>([]);
  const [wall, setWall] = useState<SocialGroupWallMessageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<GroupWallReplyTarget | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const skipScrollRef = useRef(true);
  const wallLengthRef = useRef(0);

  const canPost =
    group && membership ? canMemberPostToGroupWall(group, membership) : false;
  const isAdmin = membership?.role === 'admin';
  const postPolicy = group ? resolveGroupWallPostPolicy(group) : 'all_members';

  const mergeWall = useCallback((incoming: SocialGroupWallMessageView[]) => {
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

  const appendWallMessage = useCallback((message: SocialGroupWallMessageView) => {
    setWall((current) => {
      if (current.some((row) => row.id === message.id)) return current;
      return [...current, message];
    });
  }, []);

  const loadThread = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const [detailRes, wallRes] = await Promise.all([
          api.getMeGroupDetail(groupId),
          api.getMeGroupWall(groupId),
        ]);
        setGroup(detailRes.data.group);
        setMembership(detailRes.data.membership);
        setMembers(detailRes.data.members);
        mergeWall(wallRes.data);
      } catch (err) {
        if (!options?.silent) {
          setError(err instanceof Error ? err.message : 'Could not load group chat.');
          setWall([]);
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [groupId, mergeWall]
  );

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    skipScrollRef.current = true;
    wallLengthRef.current = 0;
  }, [groupId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadThread({ silent: true });
    }, WALL_POLL_MS);
    return () => window.clearInterval(id);
  }, [loadThread]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || loading) return;
    const grew = wall.length > wallLengthRef.current;
    wallLengthRef.current = wall.length;
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }
    if (grew) {
      container.scrollTop = container.scrollHeight;
    }
  }, [wall.length, loading]);

  const sendMessage = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !canPost || sending) return;
    const body = replyTo ? formatGroupWallReplyBody(replyTo, trimmed) : trimmed;
    const previousReply = replyTo;
    setDraft('');
    setReplyTo(null);
    setSending(true);
    setError(null);
    try {
      const res = await api.createMeGroupWallPost(groupId, body);
      appendWallMessage(res.data);
      skipScrollRef.current = false;
    } catch (err) {
      setDraft(trimmed);
      setReplyTo(previousReply);
      setError(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const updateMessageReactions = (messageId: string, reactions: SocialGroupWallMessageView['reactions']) => {
    setWall((current) =>
      current.map((message) => (message.id === messageId ? { ...message, reactions } : message))
    );
  };

  const scrollToWallMessage = useCallback((messageId: string) => {
    const container = chatContainerRef.current;
    const el = container?.querySelector(`[data-wall-message-id="${messageId}"]`);
    if (!el || !(el instanceof HTMLElement)) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightMessageId(messageId);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightMessageId(null);
      highlightTimerRef.current = null;
    }, 2200);
  }, []);

  useEffect(
    () => () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    },
    []
  );

  const activeMemberCount = members.filter((m) => m.memberType === 'adult' && m.isActive !== false).length;
  const title = group?.name || 'Group chat';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b bg-white p-3 shadow-sm pt-safe-plus-2 md:gap-3 md:pt-3">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Back to messages"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setMembersOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left hover:bg-neutral-50 pr-1"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">
              {activeMemberCount} participant{activeMemberCount === 1 ? '' : 's'} ·{' '}
              {groupWallPostPolicyLabel[postPolicy]}
            </p>
          </div>
        </button>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Chat settings"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div ref={chatContainerRef} className="min-h-0 min-w-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto bg-neutral-50 p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          </div>
        ) : wall.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
            <p className="text-sm font-medium text-neutral-700">No messages yet</p>
            <p className="mt-1 text-xs text-neutral-500">
              {canPost ? 'Say hello to the crew.' : 'Admins can post updates here.'}
            </p>
          </div>
        ) : (
          wall.map((message) => (
            <GroupWallMessageItem
              key={message.id}
              groupId={groupId}
              message={message}
              highlighted={highlightMessageId === message.id}
              replyEnabled={canPost}
              onReactionsChange={updateMessageReactions}
              onReply={setReplyTo}
              onScrollToQuotedMessage={scrollToWallMessage}
              onError={setError}
            />
          ))
        )}
      </div>

      {replyTo ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-emerald-100 bg-emerald-50/90 px-4 py-2 text-xs text-emerald-900">
          <span className="min-w-0 flex-1 truncate">
            Replying to <span className="font-semibold">{replyTo.authorName}</span>
          </span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-100"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {canPost ? (
        <ChatComposeBar
          value={draft}
          onChange={setDraft}
          onSend={sendMessage}
          sending={sending}
          placeholder={replyTo ? 'Write your reply…' : 'Write a message…'}
          className="!border-t-0 !px-4"
        />
      ) : (
        <div className="shrink-0 border-t bg-neutral-50 px-4 py-3 text-center text-xs text-neutral-600">
          {groupWallPostPolicyLabel[postPolicy]}. You can still read messages and react.
        </div>
      )}

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
            onUpdated={(updated) => setGroup(updated)}
            onError={setError}
          />
        </>
      ) : null}
    </div>
  );
};
