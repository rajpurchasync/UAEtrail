import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/services';
import { ChatConversationDTO, ChatMessageDTO } from '@uaetrail/shared-types';
import { DashboardLayout } from '../components/layout';

const userLinks = [
  { to: '/dashboard/overview', label: 'Overview' },
  { to: '/dashboard/requests', label: 'My Requests' },
  { to: '/dashboard/trips', label: 'My Trips' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/profile', label: 'Profile' }
];

export const Messages = () => {
  const [conversations, setConversations] = useState<ChatConversationDTO[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (userId: string) => {
    try {
      const res = await api.getMessages(userId, 1, 100);
      setMessages(res.data.reverse());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId, loadMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newMessage.trim()) return;
    setSending(true);
    try {
      await api.sendMessage({ receiverId: selectedUserId, content: newMessage.trim() });
      setNewMessage('');
      await loadMessages(selectedUserId);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.userId === selectedUserId);

  return (
    <DashboardLayout title="Messages" links={userLinks}>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="flex bg-white border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
        {/* Left: Conversation list */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm text-gray-700">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-gray-500 text-sm">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">No conversations yet</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.userId}
                  onClick={() => setSelectedUserId(c.userId)}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition ${selectedUserId === c.userId ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-semibold">
                          {c.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm text-gray-900">{c.displayName}</p>
                        <p className="text-xs text-gray-500 truncate w-36">{c.lastMessage}</p>
                      </div>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unreadCount}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Message thread */}
        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
                {selectedConversation?.avatarUrl ? (
                  <img src={selectedConversation.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-xs font-semibold">
                    {selectedConversation?.displayName.charAt(0).toUpperCase() ?? '?'}
                  </div>
                )}
                <p className="font-semibold text-sm text-gray-800">{selectedConversation?.displayName ?? 'User'}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId !== selectedUserId;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${isMe ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p>{m.content}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
