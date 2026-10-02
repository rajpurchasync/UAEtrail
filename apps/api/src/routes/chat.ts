import { NotificationType } from '../domain/enums.js';
import type { ChatMessage } from '../domain/types.js';
import { Router } from 'express';
import { z } from 'zod';
import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { findAuthUserById } from '../lib/auth-users.js';
import {
  countThreadMessages,
  createChatMessageRecord,
  listThreadMessages,
  markThreadAsRead
} from '../lib/chat-data.js';
import { messagesToUserPath } from '../lib/member-routes.js';
import { dispatchNotification } from '../services/notifications.js';
import { requireAuth, requireSseTicket, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSseTicket, SSE_TICKET_TTL_SECONDS } from '../lib/sse-ticket.js';
import { assertCanMessageUser, assertChatRateLimit } from '../services/chat-policy.js';
import { publishChatStreamEvent, registerChatStreamClient } from '../services/chat-stream.js';
import { listMemberDirectConversations, loadMemberInbox } from '../services/member-inbox.js';

export const chatRouter = Router();

const toChatMessageDto = (message: ChatMessage): ChatMessageDTO => ({
  id: message.id,
  senderId: message.senderId,
  receiverId: message.receiverId,
  content: message.content,
  activityId: message.activityId ?? undefined,
  readAt: message.readAt?.toISOString() ?? undefined,
  createdAt: message.createdAt.toISOString()
});

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
// ─── Conversations ──────────────────────────────────────────────────────────

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
    const conversations = await listMemberDirectConversations(req.auth!.userId);
    res.json({ data: conversations });
  } catch (error) {
    next(error);
  }
});

// ─── Messages Thread ────────────────────────────────────────────────────────

const messageThreadSchema = z.object({ userId: z.string().min(1) });
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

chatRouter.get('/messages/:userId', validate({ params: messageThreadSchema, query: paginationSchema }), async (req, res, next) => {
  try {
    const currentUserId = req.auth!.userId;
    const { userId: partnerId } = req.params as z.infer<typeof messageThreadSchema>;
    const { page, pageSize } = req.query as unknown as z.infer<typeof paginationSchema>;

    await assertCanMessageUser(currentUserId, partnerId);

    // Mark unread messages from this partner as read
    await markThreadAsRead(currentUserId, partnerId);

    const [total, messages] = await Promise.all([
      countThreadMessages(currentUserId, partnerId),
      listThreadMessages({
        currentUserId,
        partnerId,
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({
      data: messages.map(toChatMessageDto),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    next(error);
  }
});

// ─── Send Message ───────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1).max(2000),
  activityId: z.string().optional()
});

chatRouter.post('/messages', validate({ body: sendMessageSchema }), async (req, res, next) => {
  try {
    const senderId = req.auth!.userId;
    const { receiverId, content, activityId } = req.body as z.infer<typeof sendMessageSchema>;

    if (senderId === receiverId) {
      return res.status(400).json({ error: { code: 'self_message', message: 'Cannot message yourself.' } });
    }

    await assertChatRateLimit(senderId);
    await assertCanMessageUser(senderId, receiverId, { activityId });

    // Verify receiver exists
    const receiver = await findAuthUserById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: { code: 'user_not_found', message: 'Recipient not found.' } });
    }

    const message = await createChatMessageRecord({
      senderId,
      receiverId,
      content,
      activityId: activityId ?? null
    });

    const messageDto = toChatMessageDto(message);
    void publishChatStreamEvent(receiverId, { type: 'chat_message', data: messageDto });

    void findAuthUserById(senderId).then((sender) => {
      const senderName = sender?.profile.displayName ?? sender?.email ?? 'Someone';
      return dispatchNotification({
        userId: receiverId,
        title: 'New message',
        body: `${senderName}: ${content.substring(0, 100)}`,
        type: NotificationType.SYSTEM,
        meta: {
          kind: 'message',
          chatMessageId: message.id,
          actorUserId: senderId,
          path: messagesToUserPath(senderId),
        },
      });
    }).catch(() => undefined);

    res.status(201).json({
      data: messageDto
    });
  } catch (error) {
    next(error);
  }
});
