import { ChatConversationDTO, ChatMessageDTO, MemberInboxDTO } from '@uaetrail/shared-types';
import { apiRequest } from '../client';

export const chatApi = {
    getConversations: () =>
    apiRequest<{ data: ChatConversationDTO[] }>('/chat/conversations', { auth: true }),

    getInbox: (scope?: 'direct' | 'groups' | 'outings' | 'unread') =>
    apiRequest<{ data: MemberInboxDTO }>(
      scope ? `/chat/inbox?scope=${scope}` : '/chat/inbox',
      { auth: true }
    ),

    createChatStreamTicket: () =>
    apiRequest<{ data: { ticket: string; expiresIn: number } }>('/chat/stream-ticket', {
      method: 'POST',
      auth: true
    }),

    getMessages: (
      userId: string,
      options?: {
        limit?: number;
        beforeMessageId?: string;
      }
    ) => {
      const params = new URLSearchParams();
      if (options?.beforeMessageId) params.set('beforeMessageId', options.beforeMessageId);
      if (options?.limit) params.set('limit', String(options.limit));
      const qs = params.toString();
      return apiRequest<{
        data: ChatMessageDTO[];
        meta?: { hasMoreOlder?: boolean; total?: number };
      }>(`/chat/messages/${userId}${qs ? `?${qs}` : ''}`, { auth: true });
    },

    sendMessage: (payload: {
      receiverId: string;
      content: string;
      activityId?: string;
      replyToMessageId?: string;
    }) =>
    apiRequest<{ data: ChatMessageDTO }>('/chat/messages', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload)
    }),

    toggleMessageReaction: (
      messageId: string,
      payload: { partnerUserId: string; kind: string }
    ) =>
      apiRequest<{ data: { reactions: ChatMessageDTO['reactions'] } }>(
        `/chat/messages/${messageId}/reactions`,
        {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        }
      ),
} as const;
