import { useEffect, useRef } from 'react';
import { ArrowLeft, Flag, Loader2, MessageSquare, Plus, Search, X } from 'lucide-react';
import { ChatMessageDTO, ChatConversationDTO } from '@uaetrail/shared-types';
import { ChatComposeBar } from '../ui/ChatComposeBar';

const MessageAvatar = ({
  name,
  url,
  size = 'md',
}: {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  if (url) {
    return <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

interface ConversationListPanelProps {
  mobileShowThread: boolean;
  loading: boolean;
  conversations: ChatConversationDTO[];
  selectedUserId: string | null;
  onNewChat: () => void;
  onSelect: (userId: string) => void;
  formatTime: (dateStr: string) => string;
}

export const ConversationListPanel = ({
  mobileShowThread,
  loading,
  conversations,
  selectedUserId,
  onNewChat,
  onSelect,
  formatTime,
}: ConversationListPanelProps) => (
  <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-white ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
    <div className="p-4 border-b flex items-center justify-between shrink-0">
      <h3 className="font-semibold text-gray-900">Messages</h3>
      <button
        type="button"
        onClick={onNewChat}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 text-emerald-600 transition-colors"
        title="New conversation"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto min-h-0">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 px-4">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">No conversations yet</p>
          <button type="button" onClick={onNewChat} className="text-emerald-600 text-sm font-medium hover:text-emerald-700">
            Start a new conversation
          </button>
        </div>
      ) : (
        conversations.map((c) => (
          <button
            key={c.userId}
            type="button"
            onClick={() => onSelect(c.userId)}
            className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors flex items-center gap-3 ${
              selectedUserId === c.userId ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
            }`}
          >
            <MessageAvatar name={c.displayName} url={c.avatarUrl} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium truncate ${c.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                  {c.displayName}
                </p>
                {c.lastMessageAt && (
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(c.lastMessageAt)}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-xs truncate font-emoji ${c.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
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

interface MessageThreadPanelProps {
  mobileShowThread: boolean;
  selectedUserId: string | null;
  threadPartnerName: string;
  threadPartnerAvatar?: string;
  loadingMessages: boolean;
  messages: ChatMessageDTO[];
  newMessage: string;
  sending: boolean;
  onBack: () => void;
  onReport: () => void;
  onMessageChange: (value: string) => void;
  onSend: () => void | Promise<void>;
}

export const MessageThreadPanel = ({
  mobileShowThread,
  selectedUserId,
  threadPartnerName,
  threadPartnerAvatar,
  loadingMessages,
  messages,
  newMessage,
  sending,
  onBack,
  onReport,
  onMessageChange,
  onSend,
}: MessageThreadPanelProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const skipInitialScrollRef = useRef(true);

  useEffect(() => {
    skipInitialScrollRef.current = true;
    prevCountRef.current = 0;
  }, [selectedUserId]);

  useEffect(() => {
    if (loadingMessages) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    if (skipInitialScrollRef.current) {
      skipInitialScrollRef.current = false;
      prevCountRef.current = messages.length;
      return;
    }

    if (messages.length > prevCountRef.current) {
      container.scrollTop = container.scrollHeight;
      prevCountRef.current = messages.length;
    }
  }, [messages.length, loadingMessages, selectedUserId]);

  return (
    <div className={`flex-1 flex flex-col bg-white min-h-0 ${!mobileShowThread && !selectedUserId ? 'hidden md:flex' : 'flex'}`}>
      {!selectedUserId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-4">
          <MessageSquare className="w-16 h-16 mb-4 text-gray-200" />
          <p className="text-lg font-medium text-gray-500 mb-1">Your Messages</p>
          <p className="text-sm text-center">Select a conversation or start a new one</p>
        </div>
      ) : (
        <>
          <div className="shrink-0 p-3 border-b bg-white flex items-center gap-3 shadow-sm pt-safe-plus-2 md:pt-3">
            <button
              type="button"
              onClick={onBack}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <MessageAvatar name={threadPartnerName} url={threadPartnerAvatar} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{threadPartnerName}</p>
            </div>
            <button
              type="button"
              onClick={onReport}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Report user"
              title="Report user"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/50 min-h-0">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-16 font-emoji">No messages yet. Say hello! 👋</p>
            ) : (
              <>
                {messages.map((m, i) => {
                  const isMe = m.senderId !== selectedUserId;
                  const showDate =
                    i === 0 ||
                    new Date(m.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border">
                            {new Date(m.createdAt).toLocaleDateString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
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
                          <p className="whitespace-pre-wrap break-words font-emoji">{m.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className={`text-xs ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && m.readAt && <span className="text-xs text-emerald-200">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <ChatComposeBar
            value={newMessage}
            onChange={onMessageChange}
            onSend={onSend}
            sending={sending}
            placeholder="Type a message..."
          />
        </>
      )}
    </div>
  );
};

interface SearchUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface NewChatModalProps {
  open: boolean;
  searchQuery: string;
  searching: boolean;
  searchResults: SearchUser[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelectUser: (user: SearchUser) => void;
  userLabel: (u: Pick<SearchUser, 'displayName' | 'id'>) => string;
}

export const NewChatModal = ({
  open,
  searchQuery,
  searching,
  searchResults,
  onClose,
  onSearchChange,
  onSelectUser,
  userLabel,
}: NewChatModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">New Conversation</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
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
              onChange={(e) => onSearchChange(e.target.value)}
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
                type="button"
                onClick={() => onSelectUser(u)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b last:border-0 transition-colors"
              >
                <MessageAvatar name={userLabel(u)} url={u.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userLabel(u)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
