import { NotificationType } from '../domain/enums.js';
import { logger } from '../lib/logger.js';
import { createNotificationRecord } from '../lib/notifications-store.js';
import { sendPushToUser } from '../lib/push.js';

export interface NotificationInput {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  meta?: Record<string, unknown>;
}

export async function dispatchNotification(input: NotificationInput): Promise<void> {
  await createNotificationRecord({
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type,
    meta: input.meta
  });

  void sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    data: input.meta
  }).catch((err) => {
    logger.warn({ err, userId: input.userId, type: input.type }, 'push dispatch failed');
  });
}
