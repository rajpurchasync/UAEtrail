import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireSseTicket, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSseTicket, SSE_TICKET_TTL_SECONDS } from '../lib/sse-ticket.js';
import { presentChatMessagesAsDtos } from '../lib/chat-message-presenter.js';
import { registerChatStreamClient } from '../services/chat-stream.js';
import { listMemberDirectConversations, loadMemberInbox } from '../services/member-inbox.js';
import { loadDirectMessageThread } from '../services/chat-direct-messages-read.js';
import { sendDirectChatMessage } from '../services/chat-direct-messages-commands.js';
import { toggleChatMessageReaction } from '../services/chat-message-reaction-commands.js';
import { assertCanMessageUser } from '../services/chat-policy.js';
import { ApiError } from '../lib/api-error.js';
import { GROUP_WALL_REACTION_KINDS } from '../domain/group-wall-reactions.js';

export const chatRouter = Router();

chatRouter.get('/stream', requireSseTicket, requireVerifiedEmail, (req, res) => {
  const userId = req.auth!.userId;
  const unregister = registerChatStreamClient(userId, res);

  req.on('close', () => {
    unregister();
  });
});

chatRouter.use(requireAuth, requireVerifiedEmail);

chatRouter.post('/stream-ticket', async (req, res, next) => {
  try {
    const ticket = await createSseTicket(req.auth!.userId);
    res.json({ data: { ticket, expiresIn: SSE_TICKET_TTL_SECONDS } });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/inbox', async (req, res, next) => {
  try {
    const data = await loadMemberInbox(req.auth!.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/conversations', async (req, res, next) => {
  try {
    const { conversations, policyDegraded } = await listMemberDirectConversations(req.auth!.userId);
    res.json({
      data: conversations,
      meta: policyDegraded ? { directConversationsDegraded: true } : undefined,
    });
  } catch (error) {
    next(error);
  }
});

const messageThreadSchema = z.object({ userId: z.string().min(1) });
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

chatRouter.get(
  '/messages/:userId',
  validate({ params: messageThreadSchema, query: paginationSchema }),
  async (req, res, next) => {
    try {
      const currentUserId = req.auth!.userId;
      const { userId: partnerId } = req.params as z.infer<typeof messageThreadSchema>;
      const { page, pageSize } = req.query as unknown as z.infer<typeof paginationSchema>;

      await assertCanMessageUser(currentUserId, partnerId);

      const { total, messages } = await loadDirectMessageThread({
        currentUserId,
        partnerId,
        page,
        pageSize,
      });

      res.json({
        data: await presentChatMessagesAsDtos(messages, currentUserId),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (error) {
      next(error);
    }
  }
);

const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1).max(2000),
  activityId: z.string().optional(),
  replyToMessageId: z.string().min(1).optional(),
});

chatRouter.post('/messages', validate({ body: sendMessageSchema }), async (req, res, next) => {
  try {
    const senderId = req.auth!.userId;
    const body = req.body as z.infer<typeof sendMessageSchema>;
    const data = await sendDirectChatMessage({
      senderId,
      receiverId: body.receiverId,
      content: body.content,
      activityId: body.activityId,
      replyToMessageId: body.replyToMessageId,
    });
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

const chatMessageReactionParamsSchema = z.object({ messageId: z.string().min(1) });
const chatMessageReactionBodySchema = z.object({
  partnerUserId: z.string().min(1),
  kind: z.enum(GROUP_WALL_REACTION_KINDS),
});

chatRouter.post(
  '/messages/:messageId/reactions',
  validate({ params: chatMessageReactionParamsSchema, body: chatMessageReactionBodySchema }),
  async (req, res, next) => {
    try {
      const { messageId } = req.params as z.infer<typeof chatMessageReactionParamsSchema>;
      const body = req.body as z.infer<typeof chatMessageReactionBodySchema>;
      const userId = req.auth!.userId;

      await assertCanMessageUser(userId, body.partnerUserId);

      try {
        const result = await toggleChatMessageReaction({
          messageId,
          userId,
          partnerUserId: body.partnerUserId,
          kind: body.kind,
        });
        res.json({ data: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update reaction.';
        throw new ApiError(404, 'message_not_found', message);
      }
    } catch (error) {
      next(error);
    }
  }
);
