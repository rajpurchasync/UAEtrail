import { getRedisClient } from './redis.js';

const PRESIGN_TTL_SECONDS = 3600;
const memoryPending = new Map<string, { userId: string; expiresAt: number }>();

const presignKey = (key: string) => `presign:${key}`;

export async function registerPresignedUpload(key: string, userId: string): Promise<void> {
  const redis = await getRedisClient();
  if (redis) {
    await redis.setEx(presignKey(key), PRESIGN_TTL_SECONDS, userId);
    return;
  }
  memoryPending.set(key, { userId, expiresAt: Date.now() + PRESIGN_TTL_SECONDS * 1000 });
}

export async function verifyPresignedUploadOwner(key: string, userId: string): Promise<void> {
  const redis = await getRedisClient();
  if (redis) {
    const owner = await redis.get(presignKey(key));
    if (!owner || owner !== userId) {
      throw new Error('invalid_presign_owner');
    }
    return;
  }

  const entry = memoryPending.get(key);
  if (!entry || entry.userId !== userId || entry.expiresAt < Date.now()) {
    throw new Error('invalid_presign_owner');
  }
}

export async function assertPresignedUploadOwner(key: string, userId: string): Promise<void> {
  await verifyPresignedUploadOwner(key, userId);
  const redis = await getRedisClient();
  if (redis) {
    await redis.del(presignKey(key));
    return;
  }
  memoryPending.delete(key);
}
