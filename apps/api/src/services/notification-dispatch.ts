import { NotificationType } from '../domain/enums.js';
import {
  mergeNotificationPreferenceSettings,
  resolveNotificationPreferenceTopic,
  shouldDeliverNotification,
} from '@uaetrail/shared-types';
import { findAuthUserById } from '../lib/auth-users-store.js';
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
  const user = await findAuthUserById(input.userId);
  const prefs = mergeNotificationPreferenceSettings(user?.profile?.notificationPreferences);
  const kind = typeof input.meta?.kind === 'string' ? input.meta.kind : undefined;
  const topic = resolveNotificationPreferenceTopic(kind);

  if (
    !shouldDeliverNotification({
      prefs,
      topic,
      channel: 'in_app',
    })
  ) {
    return;
  }

  await createNotificationRecord({
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type,
    meta: input.meta,
  });

  if (
    shouldDeliverNotification({
      prefs,
      topic,
      channel: 'push',
    })
  ) {
    void sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      data: input.meta,
    }).catch((err) => {
      logger.warn({ err, userId: input.userId, type: input.type }, 'push dispatch failed');
    });
  }
}
