import { updateAuthUserLastActive } from './auth-users-store.js';
import { logger } from './logger.js';
import { getRedisClient } from './redis.js';

/** Minimum interval between persisted lastActiveAt writes per user. */
const LAST_ACTIVE_THROTTLE_SECONDS = 300;

const memoryLastTouch = new Map<string, number>();

export async function touchLastActive(userId: string): Promise<void> {
  const redis = await getRedisClient();
  if (redis) {
    const acquired = await redis.set(`last_active:${userId}`, '1', {
      NX: true,
      EX: LAST_ACTIVE_THROTTLE_SECONDS
    });
    if (acquired !== 'OK') return;
  } else {
    const now = Date.now();
    const last = memoryLastTouch.get(userId);
    if (last != null && now - last < LAST_ACTIVE_THROTTLE_SECONDS * 1000) return;
    memoryLastTouch.set(userId, now);
  }

  try {
    await updateAuthUserLastActive(userId);
  } catch (err) {
    logger.warn({ err, userId }, 'last_active_update_failed');
  }
}

/** Test helper — reset in-memory throttle state. */
export const resetLastActiveThrottleForTests = (): void => {
  memoryLastTouch.clear();
};
