import { ChatConversationDTO, ChatMessageDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const chatApi = {
    getConversations: () =>
    apiRequest<{ data: ChatConversationDTO[] }>('/chat/conversations', { auth: true }),

    createChatStreamTicket: () =>
    apiRequest<{ data: { ticket: string; expiresIn: number } }>('/chat/stream-ticket', {
      method: 'POST',
      auth: true
    }),

    getMessages: (userId: string, page?: number, pageSize?: number) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (pageSize) params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return apiRequest<{ data: ChatMessageDTO[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/chat/messages/${userId}${qs ? `?${qs}` : ''}`,
      { auth: true }
    );
  },

    sendMessage: (payload: { receiverId: string; content: string; activityId?: string }) =>
    apiRequest<{ data: ChatMessageDTO }>('/chat/messages', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    })
} as const;
