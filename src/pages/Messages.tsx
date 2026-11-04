import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useMessagesInbox } from '../hooks/useMessagesInbox';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { formatExploreClockFromDate, type GroupWallStreamEventDTO } from '@uaetrail/shared-types';
import { searchMembersByQuery } from '../hooks/memberPeopleClientApi';
import type { SocialGroupView, SocialGroupWallMessageView } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { GuestTabPlaceholder } from '../components/auth/GuestTabPlaceholder';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import {
  ChatThreadRouter,
  MessagesComposeSheet,
  MessagesInboxList,
  MessagesInboxToolbar,
  useDirectChatThread,
  type DirectChatThreadProps,
  type GroupChatActivityPayload,
} from '../components/chat';
import { formatWallInboxPreview } from '../utils/wallMessagePreview';
import { groupsPath, MESSAGES_PATH } from '../config/routingCatalog';
import { parseMessagesChatReturnTo } from '../utils/activityGroupChatNav';
import { navigateBack } from '../utils/backStack';
import { AUTH_RESUME_CREW_CHAT_QUERY } from '../utils/authReturnContext';
import { fetchActivityGroupChatGroupId } from '../hooks/activityGroupChatClientApi';
import { useChatStream } from '../hooks/useChatStream';
import { ReportContentDialog } from '../components/ui/ReportContentDialog';
import {
  filterInboxThreads,
  patchGroupInboxThread,
  sortInboxThreads,
  toDirectThread,
  DEFAULT_INBOX_FILTER,
  type InboxFilter,
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
  if (diffDays === 0) return formatExploreClockFromDate(d);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const MessagesGate = () => {
  const { user, initializing } = useAuth();
  if (initializing) {
    return (
      <div className="app-page-center pb-bottom-nav-safe">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('to');
  const selectedGroupId = searchParams.get('group');
  const contextActivityId = searchParams.get('activity');
  const [inboxQuery, setInboxQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>(DEFAULT_INBOX_FILTER);
  const {
    conversations,
    groupThreads,
    filterCounts,
    directConversationsDegraded,
    loading,
    unavailable,
    loadInbox,
    setConversations,
    setGroupThreads,
  } = useMessagesInbox(user?.id, inboxFilter);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [composeQuery, setComposeQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(!!searchParams.get('to'));
  const [showReport, setShowReport] = useState(false);
  const openReportDialog = useCallback(() => setShowReport(true), []);

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

  useEffect(() => {
    if (directConversationsDegraded) {
      setError('Some direct chats could not be loaded. Refresh to try again.');
    }
  }, [directConversationsDegraded]);

  const inGroupThread = Boolean(selectedGroupId);
  const inDirectThread = mobileShowThread && !!selectedUserId;
  const inThread = inGroupThread || inDirectThread;

  const directChat = useDirectChatThread({
    currentUserId: user?.id,
    /** Only load/sync a DM thread while it is open — inbox uses preview fields from `getInbox`. */
    partnerUserId: inDirectThread ? selectedUserId : null,
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
  }, [setGroupThreads]);

  useEffect(() => {
    if (!selectedGroupId) return;
    setGroupThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedGroupId && thread.kind !== 'direct'
          ? { ...thread, unreadCount: 0 }
          : thread
      )
    );
  }, [selectedGroupId, setGroupThreads]);

  useEffect(() => {
    setMobileShowThread(Boolean(searchParams.get('to') || searchParams.get('group')));
  }, [searchParams]);

  const resumeCrewChat = searchParams.get(AUTH_RESUME_CREW_CHAT_QUERY) === '1';

  useEffect(() => {
    if (!user || !resumeCrewChat || !contextActivityId || selectedGroupId) return;
    let cancelled = false;
    void fetchActivityGroupChatGroupId(contextActivityId)
      .then((groupId) => {
        if (cancelled || !groupId) return;
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('group', groupId);
          next.delete(AUTH_RESUME_CREW_CHAT_QUERY);
          return next;
        });
        setMobileShowThread(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, resumeCrewChat, contextActivityId, selectedGroupId, setSearchParams]);

  const openDirectConversation = useCallback(
    (userId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('to', userId);
        next.delete('group');
        return next;
      });
      setMobileShowThread(true);
    },
    [setSearchParams]
  );

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
    [setGroupThreads]
  );

  useChatStream({
    enabled: !!user,
    onGroupWallMessage: handleGroupWallStream,
    onMessage: (message) => {
      directChat.handleStreamMessage(message, selectedUserIdRef.current);
    },
    onReconnect: () => {
      void loadInbox();
      if (selectedUserIdRef.current) {
        directChat.reloadSilent();
      }
    },
  });

  useEffect(() => {
    if (!composeQuery.trim() || composeQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const hits = await searchMembersByQuery(composeQuery);
        if (!cancelled) setSearchResults(hits);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [composeQuery]);

  const threads = useMemo(
    () => sortInboxThreads([...conversations.map(toDirectThread), ...groupThreads]),
    [conversations, groupThreads]
  );

  const visibleThreads = useMemo(
    () => filterInboxThreads(threads, inboxFilter, inboxQuery),
    [threads, inboxFilter, inboxQuery]
  );

  const hasInboxThreads = threads.length > 0 || inboxFilter !== 'all';
  const openCompose = hasInboxThreads ? () => setShowNewChat(true) : undefined;

  const startConversation = (userResult: SearchUser) => {
    directChat.seedPartnerBrief({
      displayName: userLabel(userResult),
      avatarUrl: userResult.avatarUrl,
    });
    openDirectConversation(userResult.id);
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
    openDirectConversation(userId);
  };

  const openGroupThread = (groupId: string) => {
    setSearchParams({ group: groupId });
    setMobileShowThread(true);
  };

  const chatReturnTo = parseMessagesChatReturnTo(location.state);

  const handleGroupMetaUpdated = useCallback((group: SocialGroupView) => {
    setGroupThreads((prev) => patchGroupInboxThread(prev, group));
  }, [setGroupThreads]);

  const backToList = useCallback(() => {
    if (chatReturnTo && (selectedGroupId || selectedUserId)) {
      navigateBack(navigate, chatReturnTo);
      return;
    }
    setMobileShowThread(false);
    // Thread → inbox: pop the inbox entry underneath (keeps its scroll) rather than pushing a new one.
    navigateBack(navigate, MESSAGES_PATH);
  }, [chatReturnTo, navigate, selectedGroupId, selectedUserId]);

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
      loadingOlder: directChat.loadingOlder,
      showLoadMore: directChat.showLoadMore,
      onLoadMoreOlder: directChat.loadMoreOlder,
      consumeScrollMode: directChat.consumeScrollMode,
      messages: directChat.messages,
      draft: directChat.draft,
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
      directChat.loadingOlder,
      directChat.showLoadMore,
      directChat.loadMoreOlder,
      directChat.consumeScrollMode,
      directChat.messages,
      directChat.draft,
      directChat.setDraft,
      directChat.send,
      directChat.updateMessageReactions,
      backToList,
      openReportDialog,
    ]
  );

  const newChatModal = (
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

  const threadPane = inGroupThread && selectedGroupId ? (
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
  ) : inDirectThread ? (
    <ChatThreadRouter mode="direct" direct={{ ...directThreadProps, mobileShowThread: true }} />
  ) : (
    <div className="chat-thread-empty hidden h-full min-h-0 flex-1 flex-col items-center justify-center px-8 text-center lg:flex">
      <p className="text-lg font-semibold text-neutral-800">Your chats</p>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        Pick a conversation to read and reply. Outing chats and direct messages stay in this list.
      </p>
    </div>
  );

  return (
    <div className="chat-app flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <div
        className={`${inThread ? 'hidden lg:flex' : 'flex'} h-full min-h-0 w-full min-w-0 flex-col lg:w-[22.5rem] lg:max-w-[40%] lg:shrink-0 lg:border-r lg:border-neutral-200`}
      >
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
              counts={filterCounts}
              onQueryChange={setInboxQuery}
              onFilterChange={setInboxFilter}
              onCompose={openCompose}
            />
          }
        >
          {error ? <ConsumerErrorCard message={error} className="mb-3" /> : null}
          <div className="pb-bottom-nav-safe lg:pb-0">
            <MessagesInboxList
              threads={visibleThreads}
              loading={loading}
              unavailable={unavailable}
              inboxFilter={inboxFilter}
              inboxQuery={inboxQuery}
              selectedDirectId={selectedUserId}
              selectedGroupId={selectedGroupId}
              onSelectDirect={selectConversation}
              onSelectGroup={openGroupThread}
              formatTime={formatTime}
            />
          </div>
        </ConsumerShell>
      </div>

      <div
        className={
          inThread
            ? 'fixed inset-0 z-[1300] flex h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden bg-white lg:static lg:z-auto lg:h-full lg:max-w-none lg:min-w-0 lg:flex-1'
            : 'hidden min-h-0 min-w-0 flex-1 bg-white lg:flex'
        }
      >
        {error && inThread ? (
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{threadPane}</div>
      </div>
      {newChatModal}
      {reportDialog}
    </div>
  );
};
