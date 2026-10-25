import { createClient, type RedisClientType } from 'redis';
import { env } from '../config/env.js';

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;
let unavailableUntil = 0;

const redisConnectTimeoutMs = 8000;
export const REDIS_CONNECT_BACKOFF_MS = 30_000;

/** Skip reconnect storms after a failed handshake (old Redis, down host). */
export const noteRedisConnectFailed = (now = Date.now()): void => {
  unavailableUntil = now + REDIS_CONNECT_BACKOFF_MS;
};

export const noteRedisConnectSucceeded = (): void => {
  unavailableUntil = 0;
};

export const redisConnectAllowed = (now = Date.now()): boolean => now >= unavailableUntil;

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
  if (!redisConnectAllowed()) return null;

  if (!connecting) {
    connecting = (async () => {
      try {
        const redis = createClient({
          url: process.env.REDIS_URL,
          // RESP2 speaks to Redis 5. The default handshake sends HELLO, which those servers reject.
          RESP: 2,
          disableClientInfo: true,
          socket: {
            connectTimeout: redisConnectTimeoutMs,
            reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000))
          }
        });
        redis.on('error', (err) => console.warn('[redis]', err.message));
        await withTimeout(redis.connect(), redisConnectTimeoutMs, 'Redis connect');
        client = redis as unknown as RedisClientType;
        noteRedisConnectSucceeded();
        console.log('[redis] Connected — rate limits and SSE tickets use Redis.');
        return client;
      } catch (err) {
        if (client?.isOpen) {
          await client.quit().catch(() => {});
        }
        client = null;
        noteRedisConnectFailed();
        const message = err instanceof Error ? err.message : String(err);
        if (env.NODE_ENV === 'production') {
          throw new Error(`Redis connection failed in production: ${message}`, { cause: err });
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
