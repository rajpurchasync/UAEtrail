import { MessageSquare, Plus, Search, X } from 'lucide-react';
import { ChatConversationDTO } from '@uaetrail/shared-types';
import { MessageAvatar } from './ChatMessageAvatar';
import { ChatLoadingState } from './ChatLoadingState';

export { MessageAvatar } from './ChatMessageAvatar';

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
      <h3 className="font-semibold text-gray-900">Chat</h3>
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
        <div className="p-3">
          <ChatLoadingState variant="list" label="Loading chats" />
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
            <div className="px-3 py-3">
              <ChatLoadingState variant="list" label="Searching people" rows={3} />
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
