import { invalidateExploreMapCache } from './explore-map-cache.js';
import { scheduleSideEffect } from './schedule-side-effect.js';
import { isSideEffectOutboxEnabled } from './side-effect-outbox.js';
import { enqueueExploreMapCacheInvalidateOutbox } from './side-effect-outbox-store.js';
import { processSideEffectOutboxEntry } from '../services/side-effect-outbox-processor.js';
import { logger } from './logger.js';

/** Async explore map cache bust — durable when `SIDE_EFFECT_OUTBOX=1`. */
export const scheduleExploreMapCacheInvalidation = (logContext: string): void => {
  if (isSideEffectOutboxEnabled()) {
    void enqueueExploreMapCacheInvalidateOutbox(logContext)
      .then((outboxId) => {
        scheduleSideEffect(processSideEffectOutboxEntry(outboxId), logContext);
      })
      .catch((err) => {
        logger.warn({ err, logContext }, 'explore map invalidate outbox enqueue failed');
      });
    return;
  }

  scheduleSideEffect(invalidateExploreMapCache(), logContext);
};
