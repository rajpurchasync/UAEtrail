import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { ChatConversationDTO, GroupWallStreamEventDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { messagingApi } from '../messaging';
import type { SocialGroupView, SocialGroupWallMessageView } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { GuestTabPlaceholder } from '../components/auth/GuestTabPlaceholder';
import { MobileScreen } from '../components/layout/MobileScreen';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import {
  ChatThreadRouter,
  ConversationListPanel,
  MessagesComposeSheet,
  MessagesInboxList,
  MessagesInboxToolbar,
  NewChatModal,
  useDirectChatThread,
  type DirectChatThreadProps,
  type GroupChatActivityPayload,
} from '../components/chat';
import { formatWallInboxPreview } from '../utils/wallMessagePreview';
import { groupsPath, HOST_MESSAGES_PATH } from '../config/routingCatalog';
import { parseMessagesChatReturnTo } from '../utils/activityGroupChatNav';
import { useChatStream } from '../hooks/useChatStream';
import { ReportContentDialog } from '../components/ui/ReportContentDialog';
import {
  filterInboxThreads,
  loadGroupThreadPreviews,
  patchGroupInboxThread,
  sortInboxThreads,
  toDirectThread,
  type InboxFilter,
  type InboxThread,
} from '../utils/inboxThreads';

interface SearchUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const userLabel = (u: Pick<SearchUser, 'displayName' | 'id'>) =>
  u.displayName?.trim() || `User ${u.id.slice(0, 8)}`;

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const MessagesGate = () => {
  const { user, initializing } = useAuth();
  if (initializing) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center pb-bottom-nav-safe">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }
  if (!user) {
    return (
      <GuestTabPlaceholder
        title="Chat"
        description="Sign in to chat with hosts and your crew."
        intent="peek-details"
      />
    );
  }
  return <Messages />;
};

export const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isHostMessages = location.pathname === HOST_MESSAGES_PATH;
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([]);
  const [groupThreads, setGroupThreads] = useState<InboxThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('to'));
  const selectedGroupId = searchParams.get('group');
  const [contextActivityId, setContextActivityId] = useState<string | null>(searchParams.get('activity'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [composeQuery, setComposeQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(!!searchParams.get('to'));
  const [showReport, setShowReport] = useState(false);
  const openReportDialog = useCallback(() => setShowReport(true), []);
  const [inboxQuery, setInboxQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');

  const selectedUserIdRef = useRef<string | null>(selectedUserId);
  const selectedGroupIdRef = useRef<string | null>(selectedGroupId);
  const [streamedWallMessage, setStreamedWallMessage] = useState<SocialGroupWallMessageView | null>(
    null
  );

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    selectedGroupIdRef.current = selectedGroupId;
  }, [selectedGroupId]);

  const loadInbox = useCallback(async () => {
    try {
      const inboxRes = await messagingApi.getInbox();
      setConversations(inboxRes.data.direct);
      setGroupThreads(loadGroupThreadPreviews(inboxRes.data.groups as SocialGroupView[]));
    } catch {
      /* stream / retry fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  const directChat = useDirectChatThread({
    currentUserId: user?.id,
    partnerUserId: selectedUserId,
    contextActivityId,
    conversations,
    setConversations,
    loadInbox,
    setPageError: setError,
    queryClient,
  });

  const handleGroupChatActivity = useCallback((payload: GroupChatActivityPayload) => {
    setGroupThreads((prev) =>
      sortInboxThreads(
        prev.map((thread) =>
          thread.id === payload.groupId && thread.kind !== 'direct'
            ? {
                ...thread,
                lastMessage: formatWallInboxPreview(payload.body),
                lastMessageAt: payload.createdAt,
                unreadCount: 0,
              }
            : thread
        )
      )
    );
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    setGroupThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedGroupId && thread.kind !== 'direct'
          ? { ...thread, unreadCount: 0 }
          : thread
      )
    );
  }, [selectedGroupId]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (selectedUserId) {
      setSearchParams((prev) => {
        prev.set('to', selectedUserId);
        if (contextActivityId) prev.set('activity', contextActivityId);
        else prev.delete('activity');
        return prev;
      });
    }
  }, [selectedUserId, contextActivityId, setSearchParams]);

  useEffect(() => {
    const toUser = searchParams.get('to');
    const groupId = searchParams.get('group');
    const activityId = searchParams.get('activity');
    setContextActivityId(activityId);

    if (groupId) {
      if (toUser) setSelectedUserId(null);
      setMobileShowThread(true);
      return;
    }

    if (toUser) {
      if (toUser !== selectedUserId) setSelectedUserId(toUser);
      setMobileShowThread(true);
      return;
    }

    if (!toUser && selectedUserId && !mobileShowThread) {
      setSelectedUserId(null);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGroupWallStream = useCallback((payload: GroupWallStreamEventDTO) => {
      const openGroupId = selectedGroupIdRef.current;
      const isOpen = openGroupId === payload.groupId;
      if (isOpen) {
        setStreamedWallMessage(payload.message as SocialGroupWallMessageView);
      }
      setGroupThreads((prev) =>
        sortInboxThreads(
          prev.map((thread) => {
            if (thread.id !== payload.groupId || thread.kind === 'direct') return thread;
            return {
              ...thread,
              lastMessage: formatWallInboxPreview(payload.message.body),
              lastMessageAt: payload.message.createdAt,
              unreadCount: isOpen ? 0 : thread.unreadCount + 1,
            };
          })
        )
      );
    },
    []
  );

  useChatStream({
    enabled: !!user,
    onGroupWallMessage: handleGroupWallStream,
    onMessage: (message) => {
      directChat.handleStreamMessage(message, selectedUserIdRef.current);
    },
    onReconnect: () => {
      void loadInbox();
      directChat.reloadSilent();
    },
  });

  useEffect(() => {
    if (!composeQuery.trim() || composeQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchUsers(composeQuery);
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [composeQuery]);

  const threads = useMemo(
    () => sortInboxThreads([...conversations.map(toDirectThread), ...groupThreads]),
    [conversations, groupThreads]
  );

  const visibleThreads = useMemo(
    () => filterInboxThreads(threads, inboxFilter, inboxQuery),
    [threads, inboxFilter, inboxQuery]
  );

  const hasInboxThreads = threads.length > 0;
  const openCompose = hasInboxThreads ? () => setShowNewChat(true) : undefined;

  const startConversation = (userResult: SearchUser) => {
    directChat.seedPartnerBrief({
      displayName: userLabel(userResult),
      avatarUrl: userResult.avatarUrl,
    });
    setSelectedUserId(userResult.id);
    setMobileShowThread(true);
    setShowNewChat(false);
    setComposeQuery('');
    setSearchResults([]);
    setConversations((prev) => {
      if (prev.find((conversation) => conversation.userId === userResult.id)) return prev;
      return [
        {
          userId: userResult.id,
          displayName: userLabel(userResult),
          avatarUrl: userResult.avatarUrl ?? undefined,
          lastMessage: '',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        },
        ...prev,
      ];
    });
  };

  const selectConversation = (userId: string) => {
    setSelectedUserId(userId);
    setMobileShowThread(true);
  };

  const openGroupThread = (groupId: string) => {
    setSearchParams({ group: groupId });
    setMobileShowThread(true);
    setSelectedUserId(null);
  };

  const chatReturnTo = parseMessagesChatReturnTo(location.state);

  const handleGroupMetaUpdated = useCallback((group: SocialGroupView) => {
    setGroupThreads((prev) => patchGroupInboxThread(prev, group));
  }, []);

  const backToList = useCallback(() => {
    if (selectedGroupId && chatReturnTo) {
      navigate(chatReturnTo, { replace: true });
      return;
    }
    setMobileShowThread(false);
    setSelectedUserId(null);
    setContextActivityId(null);
    setSearchParams({});
  }, [chatReturnTo, navigate, selectedGroupId, setSearchParams]);

  const inGroupThread = Boolean(selectedGroupId);
  const inDirectThread = mobileShowThread && !!selectedUserId;
  const inThread = inGroupThread || inDirectThread;

  const openCreateGroup = () => {
    setShowNewChat(false);
    setComposeQuery('');
    setSearchResults([]);
    navigate(groupsPath({ create: true }));
  };

  const directThreadProps = useMemo(
    (): DirectChatThreadProps => ({
      mobileShowThread,
      partnerUserId: selectedUserId,
      currentUserId: user!.id,
      partnerName: directChat.partnerName,
      partnerAvatar: directChat.partnerAvatar,
      loadingMessages: directChat.loadingMessages,
      messages: directChat.messages,
      draft: directChat.draft,
      sending: directChat.sending,
      onBack: backToList,
      onReport: openReportDialog,
      onDraftChange: directChat.setDraft,
      onSend: directChat.send,
      onMessageReactionsChange: directChat.updateMessageReactions,
      onReactionError: setError,
    }),
    [
      mobileShowThread,
      selectedUserId,
      user,
      directChat.partnerName,
      directChat.partnerAvatar,
      directChat.loadingMessages,
      directChat.messages,
      directChat.draft,
      directChat.sending,
      directChat.setDraft,
      directChat.send,
      directChat.updateMessageReactions,
      backToList,
      openReportDialog,
    ]
  );

  const newChatModal = isHostMessages ? (
    <NewChatModal
      open={showNewChat}
      searchQuery={composeQuery}
      searching={searching}
      searchResults={searchResults}
      onClose={() => {
        setShowNewChat(false);
        setComposeQuery('');
        setSearchResults([]);
      }}
      onSearchChange={setComposeQuery}
      onSelectUser={startConversation}
      userLabel={userLabel}
    />
  ) : (
    <MessagesComposeSheet
      open={showNewChat}
      searchQuery={composeQuery}
      searching={searching}
      searchResults={searchResults}
      onClose={() => {
        setShowNewChat(false);
        setComposeQuery('');
        setSearchResults([]);
      }}
      onSearchChange={setComposeQuery}
      onSelectUser={startConversation}
      onCreateGroup={openCreateGroup}
      userLabel={userLabel}
    />
  );

  const reportDialog =
    selectedUserId ? (
      <ReportContentDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="user"
        targetId={selectedUserId}
        title="Report as"
      />
    ) : null;

  const threadFullscreen = inThread ? (
    <>
      <div
        className="fixed inset-0 z-[1300] flex h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden bg-white"
      >
        {error ? (
          <div className="flex shrink-0 items-center justify-between border-b border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-red-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col">
          {inGroupThread && selectedGroupId ? (
            <ChatThreadRouter
              mode="group"
              group={{
                groupId: selectedGroupId,
                onBack: backToList,
                onGroupActivity: handleGroupChatActivity,
                streamedMessage: streamedWallMessage,
                onStreamedMessageApplied: () => setStreamedWallMessage(null),
                onGroupUpdated: handleGroupMetaUpdated,
              }}
            />
          ) : (
            <ChatThreadRouter
              mode="direct"
              direct={{ ...directThreadProps, mobileShowThread: true }}
            />
          )}
        </div>
      </div>
      {newChatModal}
      {reportDialog}
    </>
  ) : null;

  if (isHostMessages && inThread) {
    return threadFullscreen;
  }

  if (isHostMessages) {
    return (
      <MobileScreen
        title="Chat"
        backTo="/host/overview"
        backLabel="Host console"
        showBanner={false}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {error && (
            <div className="mb-3 flex shrink-0 items-center justify-between rounded-ios border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-ios-lg border border-neutral-200 bg-white shadow-ios-sm">
            <ConversationListPanel
              mobileShowThread={mobileShowThread}
              loading={loading}
              conversations={conversations}
              selectedUserId={selectedUserId}
              onNewChat={() => setShowNewChat(true)}
              onSelect={selectConversation}
              formatTime={formatTime}
            />
            <ChatThreadRouter mode="direct" direct={directThreadProps} />
          </div>
          {newChatModal}
          {reportDialog}
        </div>
      </MobileScreen>
    );
  }

  if (inThread) {
    return threadFullscreen;
  }

  return (
    <>
      <ConsumerShell
        layout="tab"
        title="Chat"
        suppressMobileHeader
        suppressMobileToolbarBorder
        maxWidth="4xl"
        flush
        toolbar={
          <MessagesInboxToolbar
            query={inboxQuery}
            filter={inboxFilter}
            onQueryChange={setInboxQuery}
            onFilterChange={setInboxFilter}
            onCompose={openCompose}
          />
        }
      >
        {error ? <ConsumerErrorCard message={error} className="mb-3" /> : null}
        <div className="pb-bottom-nav-safe md:pb-4">
          <MessagesInboxList
            threads={visibleThreads}
            loading={loading}
            inboxFilter={inboxFilter}
            inboxQuery={inboxQuery}
            selectedDirectId={selectedUserId}
            onSelectDirect={selectConversation}
            onSelectGroup={openGroupThread}
            formatTime={formatTime}
          />
        </div>
      </ConsumerShell>
      {newChatModal}
      {reportDialog}
    </>
  );
};
