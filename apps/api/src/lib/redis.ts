import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;

export const isRedisConfigured = (): boolean => Boolean(process.env.REDIS_URL);

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!process.env.REDIS_URL) return null;
  if (client?.isOpen) return client;

  if (!connecting) {
    connecting = (async () => {
      try {
        const redis = createClient({ url: process.env.REDIS_URL });
        redis.on('error', (err) => console.warn('[redis]', err.message));
        await redis.connect();
        client = redis as RedisClientType;
        console.log('[redis] Connected — rate limits use Redis store.');
        return client;
      } catch (err) {
        console.warn('[redis] Unavailable — using in-memory rate limits.', err);
        return null;
      } finally {
        connecting = null;
      }
    })();
  }

  return connecting;
};

export const disconnectRedis = async (): Promise<void> => {
  if (client?.isOpen) {
    await client.quit();
  }
  client = null;
  connecting = null;
};
