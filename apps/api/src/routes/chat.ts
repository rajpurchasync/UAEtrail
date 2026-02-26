import { NotificationType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireVerifiedEmail } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const chatRouter = Router();

chatRouter.use(requireAuth, requireVerifiedEmail);

// ─── Conversations ──────────────────────────────────────────────────────────

chatRouter.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;

    // Get all distinct conversation partners
    const sent = await prisma.chatMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId']
    });
    const received = await prisma.chatMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId']
    });

    const partnerIds = [...new Set([
      ...sent.map((m) => m.receiverId),
      ...received.map((m) => m.senderId)
    ])];

    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const partner = await prisma.user.findUnique({
          where: { id: partnerId },
          include: { profile: true }
        });

        const lastMessage = await prisma.chatMessage.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.chatMessage.count({
          where: {
            senderId: partnerId,
            receiverId: userId,
            readAt: null
          }
        });

        return {
          userId: partnerId,
          displayName: partner?.profile?.displayName ?? partner?.email ?? 'Unknown',
          avatarUrl: partner?.profile?.avatarUrl ?? undefined,
          lastMessage: lastMessage?.content ?? '',
          lastMessageAt: lastMessage?.createdAt?.toISOString() ?? '',
          unreadCount
        };
      })
    );

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
    await prisma.chatMessage.updateMany({
      where: {
        senderId: partnerId,
        receiverId: currentUserId,
        readAt: null
      },
      data: { readAt: new Date() }
    });

    const total = await prisma.chatMessage.count({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: partnerId },
          { senderId: partnerId, receiverId: currentUserId }
        ]
      }
    });

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: partnerId },
          { senderId: partnerId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    res.json({
      data: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        eventId: m.eventId ?? undefined,
        readAt: m.readAt?.toISOString() ?? undefined,
        createdAt: m.createdAt.toISOString()
      })),
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
  eventId: z.string().optional()
});

chatRouter.post('/messages', validate({ body: sendMessageSchema }), async (req, res, next) => {
  try {
    const senderId = req.auth!.userId;
    const { receiverId, content, eventId } = req.body as z.infer<typeof sendMessageSchema>;

    if (senderId === receiverId) {
      return res.status(400).json({ error: { code: 'self_message', message: 'Cannot message yourself.' } });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return res.status(404).json({ error: { code: 'user_not_found', message: 'Recipient not found.' } });
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.create({
        data: { senderId, receiverId, content, eventId: eventId ?? null }
      });

      // Create notification for receiver
      const sender = await tx.user.findUnique({
        where: { id: senderId },
        include: { profile: true }
      });
      const senderName = sender?.profile?.displayName ?? sender?.email ?? 'Someone';

      await tx.notification.create({
        data: {
          userId: receiverId,
          title: 'New message',
          body: `${senderName}: ${content.substring(0, 100)}`,
          type: NotificationType.SYSTEM,
          meta: { chatMessageId: msg.id, senderId }
        }
      });

      return msg;
    });

    res.status(201).json({
      data: {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        eventId: message.eventId ?? undefined,
        createdAt: message.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});
