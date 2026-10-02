/**
 * Product-facing messaging API — one inbox, two wire transports (direct `/chat`, group wall).
 * Prefer these names in new UI code; implementations stay in `chatApi` + `social` wall methods.
 * Partner display for DMs: `accountApi.getUserBrief` (not chat transport).
 */
import { chatApi } from './chat.js';

export const messagingApi = {
  getInbox: chatApi.getInbox,
  getConversations: chatApi.getConversations,
  createStreamTicket: chatApi.createChatStreamTicket,

  direct: {
    listMessages: chatApi.getMessages,
    send: chatApi.sendMessage,
  },
} as const;
