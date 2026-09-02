import { NotificationType } from '../domain/enums.js';
import type { ChatMessage } from '../domain/types.js';
import { Router } from 'express';
import { z } from 'zod';
import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { findAuthUserById, findAuthUsersByIds } from '../lib/auth-users.js';
import {
  countThreadMessages,
  createChatMessageRecord,
  getLastMessageByPartner,
  getUnreadCountByPartner,
  listConversationPartnerIds,
  listThreadMessages,
  markThreadAsRead
} from '../lib/chat-data.js';
import { createNotificationRecord } from '../lib/notifications-store.js';
import { requireAuth, requireSseTicket, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createSseTicket, SSE_TICKET_TTL_SECONDS } from '../lib/sse-ticket.js';
import { assertCanMessageUser, assertChatRateLimit } from '../services/chat-policy.js';
import { publishChatStreamEvent, registerChatStreamClient } from '../services/chat-stream.js';

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

chatRouter.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;

    const partnerIds = await listConversationPartnerIds(userId);

    if (partnerIds.length === 0) {
      return res.json({ data: [] });
    }

    // Batch all partner data in parallel instead of N+1 per partner
    const [partners, unreadCounts] = await Promise.all([
      findAuthUsersByIds(partnerIds),
      getUnreadCountByPartner(userId, partnerIds)
    ]);

    const partnerMap = new Map(partners.map((p) => [p._id, p]));
    const unreadMap = unreadCounts;
    const lastMessageMap = await getLastMessageByPartner(userId, partnerIds);

    const conversations = partnerIds.map((partnerId) => {
      const partner = partnerMap.get(partnerId);
      const lastMsg = lastMessageMap.get(partnerId);
      return {
        userId: partnerId,
        displayName: partner?.profile.displayName ?? partner?.email ?? 'Unknown',
        avatarUrl: partner?.profile.avatarUrl ?? undefined,
        lastMessage: lastMsg?.content ?? '',
        lastMessageAt: lastMsg?.createdAt?.toISOString() ?? '',
        unreadCount: unreadMap.get(partnerId) ?? 0
      };
    });

    // Sort by last message time descending
    conversations.sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

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

    const sender = await findAuthUserById(senderId);
    const senderName = sender?.profile.displayName ?? sender?.email ?? 'Someone';
    await createNotificationRecord({
      userId: receiverId,
      title: 'New message',
      body: `${senderName}: ${content.substring(0, 100)}`,
      type: NotificationType.SYSTEM,
      meta: { chatMessageId: message.id, senderId }
    });

    const messageDto = toChatMessageDto(message);
    void publishChatStreamEvent(receiverId, { type: 'chat_message', data: messageDto });

    res.status(201).json({
      data: messageDto
    });
  } catch (error) {
    next(error);
  }
});
