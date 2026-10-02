import { NotificationType } from '../domain/enums.js';
import { Router } from 'express';
import { z } from 'zod';
import { findAuthUserById } from '../lib/auth-users.js';
import { ApiError } from '../lib/api-error.js';
import {
  countThreadMessages,
  createChatMessageRecord,
  findChatMessageInThread,
  listThreadMessages,
  markThreadAsRead
} from '../lib/chat-data.js';
import { presentChatMessageAsDto, presentChatMessagesAsDtos } from '../lib/chat-message-presenter.js';
import { messagesToUserPath } from '../lib/member-routes.js';
import { dispatchNotification } from '../services/notifications.js';
import { requireAuth, requireSseTicket, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSseTicket, SSE_TICKET_TTL_SECONDS } from '../lib/sse-ticket.js';
import { assertCanMessageUser, assertChatRateLimit } from '../services/chat-policy.js';
import { publishChatStreamEvent, registerChatStreamClient } from '../services/chat-stream.js';
import { listMemberDirectConversations, loadMemberInbox } from '../services/member-inbox.js';

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
      data: await presentChatMessagesAsDtos(messages),
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
  activityId: z.string().optional(),
  replyToMessageId: z.string().min(1).optional(),
});

chatRouter.post('/messages', validate({ body: sendMessageSchema }), async (req, res, next) => {
  try {
    const senderId = req.auth!.userId;
    const { receiverId, content, activityId, replyToMessageId } = req.body as z.infer<
      typeof sendMessageSchema
    >;

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

    const trimmedReplyId = replyToMessageId?.trim() || null;
    if (trimmedReplyId) {
      const parent = await findChatMessageInThread(trimmedReplyId, senderId, receiverId);
      if (!parent) {
        throw new ApiError(400, 'invalid_reply', 'Reply target is not in this conversation.');
      }
    }

    const message = await createChatMessageRecord({
      senderId,
      receiverId,
      content,
      activityId: activityId ?? null,
      replyToMessageId: trimmedReplyId,
    });

    const messageDto = await presentChatMessageAsDto(message);
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
