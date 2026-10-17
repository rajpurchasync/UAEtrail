import { invalidateExploreMapCache } from '../lib/explore-map-cache.js';
import { logger } from '../lib/logger.js';
import { isSideEffectOutboxEnabled } from '../lib/side-effect-outbox.js';
import {
  SideEffectOutboxKind,
  claimOutboxEntry,
  drainableOutboxIds,
  markOutboxDone,
  markOutboxFailed,
  releaseStaleProcessingOutboxEntries
} from '../lib/side-effect-outbox-store.js';
import { dispatchNotification, type NotificationInput } from './notification-dispatch.js';

const DEFAULT_DRAIN_INTERVAL_MS = 30_000;
const DEFAULT_DRAIN_BATCH = 25;
const STALE_PROCESSING_MS = 5 * 60_000;

let drainTimer: ReturnType<typeof setInterval> | null = null;
let drainInFlight = false;

export const processSideEffectOutboxEntry = async (outboxId: string): Promise<void> => {
  const entry = await claimOutboxEntry(outboxId);
  if (!entry) {
    return;
  }

  try {
    if (entry.kind === SideEffectOutboxKind.NOTIFICATION) {
      await dispatchNotification(entry.payload as NotificationInput);
    } else if (entry.kind === SideEffectOutboxKind.EXPLORE_MAP_CACHE_INVALIDATE) {
      await invalidateExploreMapCache();
    } else {
      throw new Error(`unknown outbox kind: ${entry.kind}`);
    }
    await markOutboxDone(outboxId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markOutboxFailed(outboxId, message);
    throw err;
  }
};

export const drainSideEffectOutbox = async (): Promise<number> => {
  if (!isSideEffectOutboxEnabled()) {
    return 0;
  }

  await releaseStaleProcessingOutboxEntries(STALE_PROCESSING_MS);
  const ids = await drainableOutboxIds(DEFAULT_DRAIN_BATCH);
  let processed = 0;

  for (const id of ids) {
    try {
      await processSideEffectOutboxEntry(id);
      processed += 1;
    } catch (err) {
      logger.warn({ err, outboxId: id }, 'side effect outbox drain entry failed');
    }
  }

  return processed;
};

const readDrainIntervalMs = (): number => {
  const raw = process.env.SIDE_EFFECT_OUTBOX_DRAIN_INTERVAL_MS?.trim();
  if (!raw) return DEFAULT_DRAIN_INTERVAL_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 5_000 ? parsed : DEFAULT_DRAIN_INTERVAL_MS;
};

export const startSideEffectOutboxDrain = (): void => {
  if (!isSideEffectOutboxEnabled() || process.env.NODE_ENV === 'test') {
    return;
  }
  if (drainTimer) {
    return;
  }

  const intervalMs = readDrainIntervalMs();
  drainTimer = setInterval(() => {
    if (drainInFlight) return;
    drainInFlight = true;
    void drainSideEffectOutbox()
      .catch((err) => {
        logger.warn({ err }, 'side effect outbox drain tick failed');
      })
      .finally(() => {
        drainInFlight = false;
      });
  }, intervalMs);

  void drainSideEffectOutbox().catch((err) => {
    logger.warn({ err }, 'side effect outbox initial drain failed');
  });
};

export const stopSideEffectOutboxDrain = (): void => {
  if (drainTimer) {
    clearInterval(drainTimer);
    drainTimer = null;
  }
};
