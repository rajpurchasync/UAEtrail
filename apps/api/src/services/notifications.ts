import { NotificationType, Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { sendPushToUser } from '../lib/push.js';

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface NotificationInput {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  meta?: Record<string, unknown>;
}

export async function dispatchNotification(
  db: DbClient,
  input: NotificationInput
): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      meta: input.meta as Prisma.InputJsonValue | undefined
    }
  });

  // Fire-and-forget push; only works when VAPID keys are configured
  if ('$connect' in db) {
    void sendPushToUser(db as PrismaClient, input.userId, {
      title: input.title,
      body: input.body,
      data: input.meta
    });
  }
}
