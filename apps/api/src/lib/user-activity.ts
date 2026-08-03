import { updateAuthUserLastActive } from './auth-users.js';
import { getRedisClient } from './redis.js';

/** Minimum interval between persisted lastActiveAt writes per user. */
export const LAST_ACTIVE_THROTTLE_SECONDS = 300;

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

  await updateAuthUserLastActive(userId).catch(() => undefined);
}

/** Test helper — reset in-memory throttle state. */
export const resetLastActiveThrottleForTests = (): void => {
  memoryLastTouch.clear();
};
