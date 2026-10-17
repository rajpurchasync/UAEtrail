import { logger } from '../lib/logger.js';
import { isSideEffectOutboxEnabled } from '../lib/side-effect-outbox.js';
import { scheduleNotificationViaOutbox } from '../lib/side-effect-outbox-schedule.js';
import {
  dispatchNotification,
  type NotificationInput
} from './notification-dispatch.js';

export type { NotificationInput } from './notification-dispatch.js';
export { dispatchNotification } from './notification-dispatch.js';

/** Side-effect notification — logs failures instead of swallowing errors. */
export const scheduleNotification = (input: NotificationInput, logContext: string): void => {
  if (isSideEffectOutboxEnabled()) {
    scheduleNotificationViaOutbox(input, logContext);
    return;
  }

  void dispatchNotification(input).catch((err) => {
    logger.warn({ err, userId: input.userId, type: input.type, logContext }, 'notification dispatch failed');
  });
};
