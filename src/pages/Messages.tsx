import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { api } from '../api/services';
import { ChatConversationDTO, ChatMessageDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout';
import { MobileScreen } from '../components/layout/MobileScreen';
import { HOST_DASHBOARD_LINKS } from '../constants';
import { useChatStream } from '../hooks/useChatStream';
import { useIsMobile } from '../hooks/useIsMobile';
import { ReportContentDialog } from '../components/ui/ReportContentDialog';
import { ConversationListPanel, MessageThreadPanel, NewChatModal } from '../components/messages/MessagePanels';

const userLinks = [
  { to: '/profile', label: 'Profile' },
  { to: '/my-requests', label: 'My Requests' },
  { to: '/activities?tab=joined', label: 'My Activities' },
  { to: '/messages', label: 'Messages' },
  { to: '/notifications', label: 'Notifications' },
];

interface SearchUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const userLabel = (u: Pick<SearchUser, 'displayName' | 'id'>) =>
  u.displayName?.trim() || `User ${u.id.slice(0, 8)}`;

export const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isConsumerMessages = location.pathname === '/messages';
  const isHostMessages = location.pathname === '/host/messages';
  const useMobileShell = isConsumerMessages || (isHostMessages && isMobile);
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('to'));
  const [contextActivityId, setContextActivityId] = useState<string | null>(searchParams.get('activity'));
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(!!searchParams.get('to'));
  const [partnerBrief, setPartnerBrief] = useState<{ displayName: string; avatarUrl?: string | null } | null>(null);
  const [showReport, setShowReport] = useState(false);

  const selectedUserIdRef = useRef<string | null>(selectedUserId);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const isHost =
    user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';
  const links = isHost ? HOST_DASHBOARD_LINKS : userLinks;

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.data);
    } catch {
      // silent — polling fallback
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
        prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

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
    const conv = conversations.find((c) => c.userId === selectedUserId);
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
          void loadConversations();
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
      void loadConversations();
      const partnerId = selectedUserIdRef.current;
      if (partnerId) void loadMessages(partnerId, true);
    },
  });

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchUsers(searchQuery);
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      void loadConversations();
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
    setSearchQuery('');
    setSearchResults([]);
    setConversations((prev) => {
      if (prev.find((c) => c.userId === userResult.id)) return prev;
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

  const backToList = () => {
    setMobileShowThread(false);
    setSelectedUserId(null);
    setContextActivityId(null);
    setSearchParams({});
  };

  const inThread = mobileShowThread && !!selectedUserId;
  const selectedConversation = conversations.find((c) => c.userId === selectedUserId);
  const threadPartnerName = selectedConversation?.displayName ?? partnerBrief?.displayName ?? 'User';
  const threadPartnerAvatar = selectedConversation?.avatarUrl ?? partnerBrief?.avatarUrl ?? undefined;

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

  const chatContent = (
    <div className={`flex flex-col ${useMobileShell ? 'flex-1 min-h-0' : ''}`}>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-ios flex items-center justify-between shrink-0">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div
        className={`flex bg-white overflow-hidden shadow-ios-sm min-h-0 ${
          useMobileShell ? 'flex-1' : 'border rounded-ios-lg'
        } ${!useMobileShell || !inThread ? 'border rounded-ios-lg' : ''}`}
        style={useMobileShell ? undefined : { height: 'calc(100vh - 220px)', minHeight: '400px' }}
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
      <NewChatModal
        open={showNewChat}
        searchQuery={searchQuery}
        searching={searching}
        searchResults={searchResults}
        onClose={() => {
          setShowNewChat(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        onSearchChange={setSearchQuery}
        onSelectUser={startConversation}
        userLabel={userLabel}
      />
      {selectedUserId && (
        <ReportContentDialog
          open={showReport}
          onClose={() => setShowReport(false)}
          targetType="user"
          targetId={selectedUserId}
          title="Report user"
        />
      )}
    </div>
  );

  if (useMobileShell) {
    return (
      <MobileScreen
        title="Messages"
        backTo={isHost ? '/host/overview' : '/profile'}
        hideHeader={inThread}
        showBanner={!inThread}
      >
        <div className={`flex flex-col flex-1 min-h-0 ${inThread ? 'px-0 -mx-1' : ''}`}>{chatContent}</div>
      </MobileScreen>
    );
  }

  return (
    <DashboardLayout title="Messages" links={links}>
      {chatContent}
    </DashboardLayout>
  );
};
