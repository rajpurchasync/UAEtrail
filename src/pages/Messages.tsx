import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Search, Send, ArrowLeft, Plus, X, MessageSquare, Loader2, Flag } from 'lucide-react';
import { api } from '../api/services';
import { ChatConversationDTO, ChatMessageDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout';
import { MobileScreen } from '../components/layout/MobileScreen';
import { ORGANIZER_DASHBOARD_LINKS } from '../constants';
import { useChatStream } from '../hooks/useChatStream';
import { useIsMobile } from '../hooks/useIsMobile';
import { ReportContentDialog } from '../components/ui/ReportContentDialog';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'My Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' }
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
  const isOrganizerMessages = location.pathname === '/organizer/messages';
  const useMobileShell = isConsumerMessages || (isOrganizerMessages && isMobile);
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('to'));
  const [contextEventId, setContextEventId] = useState<string | null>(searchParams.get('event'));
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New conversation modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Mobile: show thread or list
  const [mobileShowThread, setMobileShowThread] = useState(!!searchParams.get('to'));
  const [partnerBrief, setPartnerBrief] = useState<{ displayName: string; avatarUrl?: string | null } | null>(null);
  const [showReport, setShowReport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedUserIdRef = useRef<string | null>(selectedUserId);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const isOrganizer = user?.role === 'tenant_owner' || user?.role === 'tenant_admin' || user?.role === 'tenant_guide';
  const links = isOrganizer ? ORGANIZER_DASHBOARD_LINKS : userLinks;

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations
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

  // Load messages for a user
  const loadMessages = useCallback(async (userId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await api.getMessages(userId, 1, 100);
      setMessages(res.data.reverse());
      // Update unread count in conversations list
      setConversations((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // When selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
      setSearchParams((prev) => {
        prev.set('to', selectedUserId);
        if (contextEventId) prev.set('event', contextEventId);
        else prev.delete('event');
        return prev;
      });
    }
  }, [selectedUserId, contextEventId, loadMessages, setSearchParams]);

  // Sync deep-link query params when navigating from trip cards, etc.
  useEffect(() => {
    const toUser = searchParams.get('to');
    const eventId = searchParams.get('event');
    setContextEventId(eventId);

    if (toUser) {
      if (toUser !== selectedUserId) setSelectedUserId(toUser);
      setMobileShowThread(true);
      return;
    }

    if (!toUser && selectedUserId && !mobileShowThread) {
      setSelectedUserId(null);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when conversation selected
  useEffect(() => {
    if (selectedUserId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedUserId]);

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
      if (
        partnerId &&
        (message.senderId === partnerId || message.receiverId === partnerId)
      ) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          return [...prev, message];
        });
      }

      setConversations((prev) => {
        const partner =
          message.senderId === user?.id ? message.receiverId : message.senderId;
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
                        : conversation.unreadCount
                }
              : conversation
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
      });
    },
    onReconnect: () => {
      void loadConversations();
      const partnerId = selectedUserIdRef.current;
      if (partnerId) {
        void loadMessages(partnerId, true);
      }
    }
  });

  // User search for new conversations
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newMessage.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.sendMessage({
        receiverId: selectedUserId,
        content: newMessage.trim(),
        ...(contextEventId ? { eventId: contextEventId } : {}),
      });
      setNewMessage('');
      setMessages((prev) => [...prev, res.data]);
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startConversation = (userResult: SearchUser) => {
    setPartnerBrief({
      displayName: userLabel(userResult),
      avatarUrl: userResult.avatarUrl
    });
    setSelectedUserId(userResult.id);
    setMobileShowThread(true);
    setShowNewChat(false);
    setSearchQuery('');
    setSearchResults([]);
    // Add to conversations list if not already there
    setConversations((prev) => {
      if (prev.find((c) => c.userId === userResult.id)) return prev;
      return [
        {
          userId: userResult.id,
          displayName: userLabel(userResult),
          avatarUrl: userResult.avatarUrl ?? undefined,
          lastMessage: '',
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0
        },
        ...prev
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
    setContextEventId(null);
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

  const Avatar = ({ name, url, size = 'md' }: { name: string; url?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
    if (url) {
      return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />;
    }
    return (
      <div className={`${sizes[size]} rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold flex-shrink-0`}>
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  // ─── Conversation List Panel ──────────────────────────────────────────

  const ConversationList = () => (
    <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-white ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Messages</h3>
        <button
          onClick={() => setShowNewChat(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 text-emerald-600 transition-colors"
          title="New conversation"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-2">No conversations yet</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="text-emerald-600 text-sm font-medium hover:text-emerald-700"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.userId}
              onClick={() => selectConversation(c.userId)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                selectedUserId === c.userId ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
              }`}
            >
              <Avatar name={c.displayName} url={c.avatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium truncate ${c.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {c.displayName}
                  </p>
                  {c.lastMessageAt && (
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                    {c.lastMessage || 'No messages yet'}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="bg-emerald-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ─── Message Thread Panel ─────────────────────────────────────────────

  const MessageThread = () => (
    <div className={`flex-1 flex flex-col bg-white ${!mobileShowThread && !selectedUserId ? 'hidden md:flex' : 'flex'}`}>
      {!selectedUserId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-4">
          <MessageSquare className="w-16 h-16 mb-4 text-gray-200" />
          <p className="text-lg font-medium text-gray-500 mb-1">Your Messages</p>
          <p className="text-sm text-center">Select a conversation or start a new one</p>
        </div>
      ) : (
        <>
          {/* Thread header */}
          <div className="shrink-0 p-3 border-b bg-white flex items-center gap-3 shadow-sm pt-safe-plus-2 md:pt-3">
            <button
              onClick={backToList}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Avatar
              name={threadPartnerName}
              url={threadPartnerAvatar}
            />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">
                {threadPartnerName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Report user"
              title="Report user"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/50">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-16">
                No messages yet. Say hello! 👋
              </p>
            ) : (
              <>
                {messages.map((m, i) => {
                  const isMe = m.senderId !== selectedUserId;
                  const showDate =
                    i === 0 ||
                    new Date(m.createdAt).toDateString() !==
                      new Date(messages[i - 1].createdAt).toDateString();
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border">
                            {new Date(m.createdAt).toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                        <div
                          className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm border'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className={`text-xs ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isMe && m.readAt && (
                              <span className="text-xs text-emerald-200">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Send bar */}
          <form onSubmit={handleSend} className="shrink-0 p-3 pb-safe border-t bg-white flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 min-w-0 border border-gray-200 rounded-full px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );

  // ─── New Conversation Modal ───────────────────────────────────────────

  const NewChatModal = () =>
    showNewChat ? (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">New Conversation</h3>
            <button onClick={() => { setShowNewChat(false); setSearchQuery(''); setSearchResults([]); }} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto border-t">
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">
                {searchQuery.length >= 2 ? 'No users found' : 'Type at least 2 characters to search'}
              </p>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startConversation(u)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-0 transition-colors"
                >
                  <Avatar name={userLabel(u)} url={u.avatarUrl ?? undefined} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{userLabel(u)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    ) : null;

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
        className={`flex bg-white overflow-hidden shadow-ios-sm ${
          useMobileShell ? 'flex-1 min-h-0' : 'border rounded-ios-lg'
        } ${!useMobileShell || !inThread ? 'border rounded-ios-lg' : ''}`}
        style={useMobileShell ? undefined : { height: 'calc(100vh - 220px)', minHeight: '400px' }}
      >
        <ConversationList />
        <MessageThread />
      </div>
      <NewChatModal />
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
        backTo={isOrganizer ? '/organizer/overview' : '/profile'}
        hideHeader={inThread}
      >
        <div className={`flex flex-col flex-1 min-h-0 ${inThread ? 'px-0' : ''}`}>{chatContent}</div>
      </MobileScreen>
    );
  }

  return (
    <DashboardLayout title="Messages" links={links}>
      {chatContent}
    </DashboardLayout>
  );
};
