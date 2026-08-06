import { createClient, type RedisClientType } from 'redis';
import { env } from '../config/env.js';

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;

const redisConnectTimeoutMs = 8000;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

export const isRedisConfigured = (): boolean => Boolean(process.env.REDIS_URL);

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!process.env.REDIS_URL) return null;
  if (client?.isOpen) return client;

  if (!connecting) {
    connecting = (async () => {
      try {
        const redis = createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: redisConnectTimeoutMs,
            reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000))
          }
        });
        redis.on('error', (err) => console.warn('[redis]', err.message));
        await withTimeout(redis.connect(), redisConnectTimeoutMs, 'Redis connect');
        client = redis as RedisClientType;
        console.log('[redis] Connected — rate limits and SSE tickets use Redis.');
        return client;
      } catch (err) {
        if (client?.isOpen) {
          await client.quit().catch(() => {});
        }
        client = null;
        const message = err instanceof Error ? err.message : String(err);
        if (env.NODE_ENV === 'production') {
          throw new Error(`Redis connection failed in production: ${message}`);
        }
        console.warn('[redis] Unavailable — using in-memory fallbacks.', message);
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
