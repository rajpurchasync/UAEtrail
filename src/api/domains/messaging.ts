/**
 * Product-facing messaging API — one inbox, two wire transports.
 *
 * - **Inbox + direct:** `/chat/*` (via `chatApi`)
 * - **Crew / group thread:** group wall under `/me/groups/.../wall` (via `socialApi`)
 *
 * App code outside `src/api/` should import from `src/messaging` (not `api.getMessages`).
 */
import { chatApi } from './chat.js';
import { socialApi } from './social.js';

export const messagingApi = {
  getInbox: chatApi.getInbox,
  getConversations: chatApi.getConversations,
  createStreamTicket: chatApi.createChatStreamTicket,

  direct: {
    listMessages: chatApi.getMessages,
    send: chatApi.sendMessage,
    toggleReaction: (
      messageId: string,
      partnerUserId: string,
      kind: string
    ) => chatApi.toggleMessageReaction(messageId, { partnerUserId, kind }),
  },

  crew: {
    getWall: socialApi.getMeGroupWall,
    markWallRead: socialApi.markMeGroupWallRead,
    post: socialApi.createMeGroupWallPost,
    toggleReaction: socialApi.toggleMeGroupWallReaction,
  },
} as const;
