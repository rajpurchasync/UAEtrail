import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import type { ChatConversationDTO, ChatMessageDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import type { SocialGroupView } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { GuestTabPlaceholder } from '../components/auth/GuestTabPlaceholder';
import { MobileScreen } from '../components/layout/MobileScreen';
import { ConsumerErrorCard } from '../components/mobile/ConsumerFeedback';
import { MessagesInboxList } from '../components/messages/MessagesInboxList';
import { MessagesInboxToolbar } from '../components/messages/MessagesInboxToolbar';
import {
  ConversationListPanel,
  MessageThreadPanel,
  NewChatModal,
} from '../components/messages/MessagePanels';
import { useChatStream } from '../hooks/useChatStream';
import { ReportContentDialog } from '../components/ui/ReportContentDialog';
import {
  filterInboxThreads,
  loadGroupThreadPreviews,
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
        title="Messages"
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
  const isHostMessages = location.pathname === '/host/messages';
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([]);
  const [groupThreads, setGroupThreads] = useState<InboxThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('to'));
  const [contextActivityId, setContextActivityId] = useState<string | null>(searchParams.get('activity'));
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [composeQuery, setComposeQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(!!searchParams.get('to'));
  const [partnerBrief, setPartnerBrief] = useState<{ displayName: string; avatarUrl?: string | null } | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [inboxQuery, setInboxQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');

  const selectedUserIdRef = useRef<string | null>(selectedUserId);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const loadInbox = useCallback(async () => {
    try {
      const [convRes, groupsRes] = await Promise.all([
        api.getConversations(),
        api.getMeGroups().catch(() => ({ data: [] as SocialGroupView[] })),
      ]);
      setConversations(convRes.data);
      setGroupThreads(await loadGroupThreadPreviews(groupsRes.data));
    } catch {
      /* stream / retry fallback */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (userId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await api.getMessages(userId, 1, 100);
      setMessages(res.data.reverse());
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.userId === userId ? { ...conversation, unreadCount: 0 } : conversation
        )
      );
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: ['inbox-unread', user.id] });
      }
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [queryClient, user?.id]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (selectedUserId) {
      void loadMessages(selectedUserId);
      setSearchParams((prev) => {
        prev.set('to', selectedUserId);
        if (contextActivityId) prev.set('activity', contextActivityId);
        else prev.delete('activity');
        return prev;
      });
    }
  }, [selectedUserId, contextActivityId, loadMessages, setSearchParams]);

  useEffect(() => {
    const toUser = searchParams.get('to');
    const activityId = searchParams.get('activity');
    setContextActivityId(activityId);

    if (toUser) {
      if (toUser !== selectedUserId) setSelectedUserId(toUser);
      setMobileShowThread(true);
      return;
    }

    if (!toUser && selectedUserId && !mobileShowThread) {
      setSelectedUserId(null);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedUserId) {
      setPartnerBrief(null);
      return;
    }
    const conv = conversations.find((conversation) => conversation.userId === selectedUserId);
    if (conv) {
      setPartnerBrief({ displayName: conv.displayName, avatarUrl: conv.avatarUrl });
      return;
    }
    api.getUserBrief(selectedUserId)
      .then((res) => setPartnerBrief(res.data))
      .catch(() => setPartnerBrief(null));
  }, [selectedUserId, conversations]);

  useChatStream({
    enabled: !!user,
    onMessage: (message) => {
      const partnerId = selectedUserIdRef.current;
      if (partnerId && (message.senderId === partnerId || message.receiverId === partnerId)) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      setConversations((prev) => {
        const partner = message.senderId === user?.id ? message.receiverId : message.senderId;
        const existing = prev.find((conversation) => conversation.userId === partner);
        if (!existing) {
          void loadInbox();
          return prev;
        }

        return prev
          .map((conversation) =>
            conversation.userId === partner
              ? {
                  ...conversation,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  unreadCount:
                    partnerId === partner && message.senderId === partner
                      ? 0
                      : message.senderId === partner
                        ? conversation.unreadCount + 1
                        : conversation.unreadCount,
                }
              : conversation
          )
          .sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
      });
    },
    onReconnect: () => {
      void loadInbox();
      const partnerId = selectedUserIdRef.current;
      if (partnerId) void loadMessages(partnerId, true);
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

  const handleSend = async () => {
    if (!user || !selectedUserId || !newMessage.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.sendMessage({
        receiverId: selectedUserId,
        content: newMessage.trim(),
        ...(contextActivityId ? { activityId: contextActivityId } : {}),
      });
      setNewMessage('');
      setMessages((prev) => [...prev, res.data]);
      void loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startConversation = (userResult: SearchUser) => {
    setPartnerBrief({
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
    navigate(`/groups?group=${encodeURIComponent(groupId)}`);
  };

  const backToList = () => {
    setMobileShowThread(false);
    setSelectedUserId(null);
    setContextActivityId(null);
    setSearchParams({});
  };

  const inThread = mobileShowThread && !!selectedUserId;

  const selectedConversation = conversations.find((conversation) => conversation.userId === selectedUserId);
  const threadPartnerName = selectedConversation?.displayName ?? partnerBrief?.displayName ?? 'User';
  const threadPartnerAvatar = selectedConversation?.avatarUrl ?? partnerBrief?.avatarUrl ?? undefined;

  const newChatModal = (
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
  );

  const reportDialog =
    selectedUserId ? (
      <ReportContentDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="user"
        targetId={selectedUserId}
        title="Report user"
      />
    ) : null;

  if (isHostMessages) {
    return (
      <MobileScreen
        title="Messages"
        backTo="/host/overview"
        backLabel="Host console"
        hideHeader={inThread}
        showBanner={false}
      >
        <div className={`flex min-h-0 flex-1 flex-col ${inThread ? 'px-0 -mx-1' : ''}`}>
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
          <div
            className={`flex min-h-0 flex-1 overflow-hidden rounded-ios-lg border bg-white shadow-ios-sm ${
              inThread ? '' : 'border-neutral-200'
            }`}
          >
            <ConversationListPanel
              mobileShowThread={mobileShowThread}
              loading={loading}
              conversations={conversations}
              selectedUserId={selectedUserId}
              onNewChat={() => setShowNewChat(true)}
              onSelect={selectConversation}
              formatTime={formatTime}
            />
            <MessageThreadPanel
              mobileShowThread={mobileShowThread}
              selectedUserId={selectedUserId}
              threadPartnerName={threadPartnerName}
              threadPartnerAvatar={threadPartnerAvatar}
              loadingMessages={loadingMessages}
              messages={messages}
              newMessage={newMessage}
              sending={sending}
              onBack={backToList}
              onReport={() => setShowReport(true)}
              onMessageChange={setNewMessage}
              onSend={handleSend}
            />
          </div>
          {newChatModal}
          {reportDialog}
        </div>
      </MobileScreen>
    );
  }

  return (
    <div className="min-h-screen consumer-bg md:bg-gray-50">
      {!inThread ? (
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <MessagesInboxToolbar
            query={inboxQuery}
            filter={inboxFilter}
            onQueryChange={setInboxQuery}
            onFilterChange={setInboxFilter}
            onCompose={() => setShowNewChat(true)}
          />
        </div>
      ) : null}

      <div
        className={`mx-auto w-full max-w-4xl px-4 sm:px-6 ${
          inThread ? 'fixed inset-0 z-[1300] flex max-w-none flex-col bg-white px-0 sm:px-0' : 'pb-bottom-nav-safe md:pb-8'
        }`}
      >
        {error && !inThread && <ConsumerErrorCard message={error} className="mb-3" />}
        {error && inThread && (
          <div className="mb-3 flex shrink-0 items-center justify-between border-b border-red-200 bg-red-50 p-3">
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

        {inThread ? (
          <MessageThreadPanel
            mobileShowThread={mobileShowThread}
            selectedUserId={selectedUserId}
            threadPartnerName={threadPartnerName}
            threadPartnerAvatar={threadPartnerAvatar}
            loadingMessages={loadingMessages}
            messages={messages}
            newMessage={newMessage}
            sending={sending}
            onBack={backToList}
            onReport={() => setShowReport(true)}
            onMessageChange={setNewMessage}
            onSend={handleSend}
          />
        ) : (
          <MessagesInboxList
            threads={visibleThreads}
            loading={loading}
            selectedDirectId={selectedUserId}
            onSelectDirect={selectConversation}
            onSelectGroup={openGroupThread}
            onCompose={() => setShowNewChat(true)}
            formatTime={formatTime}
          />
        )}
      </div>

      {newChatModal}
      {reportDialog}
    </div>
  );
};
