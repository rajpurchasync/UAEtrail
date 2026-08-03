import { NotificationType } from '../domain/enums.js';
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

  // Fire-and-forget push; only works when VAPID keys are configured
  void sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    data: input.meta
  });
}

/** @deprecated Use dispatchNotification */
export const dispatchNotificationDefault = dispatchNotification;
