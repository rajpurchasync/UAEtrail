import { getRedisClient } from './redis.js';

type MemoryEntry<T> = { expiresAt: number; etag: string; payload: T };

const memory = new Map<string, MemoryEntry<unknown>>();
const TTL_MS = 60_000;

export const geoCacheGet = async <T>(key: string): Promise<{ etag: string; payload: T } | null> => {
  const now = Date.now();
  const local = memory.get(key) as MemoryEntry<T> | undefined;
  if (local && local.expiresAt > now) return { etag: local.etag, payload: local.payload };

  const redis = await getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(`geo:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { etag: string; payload: T };
    memory.set(key, { expiresAt: now + TTL_MS, etag: parsed.etag, payload: parsed.payload });
    return parsed;
  } catch {
    return null;
  }
};

export const geoCacheInvalidate = async (): Promise<void> => {
  memory.clear();
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    const keys = await redis.keys('geo:*');
    if (keys.length) await redis.del(keys);
  } catch {
    /* non-fatal */
  }
};

export const geoCacheSet = async <T>(key: string, etag: string, payload: T): Promise<void> => {
  memory.set(key, { expiresAt: Date.now() + TTL_MS, etag, payload });
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.set(`geo:${key}`, JSON.stringify({ etag, payload }), { EX: 60 });
  } catch {
    /* non-fatal */
  }
};
