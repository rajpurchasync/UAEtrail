import { logger } from './logger.js';
import { scheduleSideEffect } from './schedule-side-effect.js';
import { enqueueNotificationOutbox } from './side-effect-outbox-store.js';
import type { NotificationInput } from '../services/notification-dispatch.js';
import { processSideEffectOutboxEntry } from '../services/side-effect-outbox-processor.js';

export const scheduleNotificationViaOutbox = (
  input: NotificationInput,
  logContext: string
): void => {
  void enqueueNotificationOutbox(input, logContext)
    .then((outboxId) => {
      scheduleSideEffect(processSideEffectOutboxEntry(outboxId), logContext);
    })
    .catch((err) => {
      logger.warn(
        { err, userId: input.userId, type: input.type, logContext },
        'notification outbox enqueue failed'
      );
    });
};
