/**
 * Product-facing messaging API — one inbox, two wire transports.
 *
 * - **Inbox + direct:** `/chat/*` (via `chatApi`)
 * - **Crew / group thread:** group wall under `/me/groups/.../wall` (via `groupsApi`)
 *
 * App code outside `src/api/` should import from `src/messaging` (not `api.getMessages`).
 */
import { chatApi } from './chat.js';
import { groupsApi } from './groups.js';

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
    getWall: groupsApi.getMeGroupWall,
    markWallRead: groupsApi.markMeGroupWallRead,
    post: groupsApi.createMeGroupWallPost,
    toggleReaction: groupsApi.toggleMeGroupWallReaction,
  },
} as const;
