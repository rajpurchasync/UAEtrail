import type { Response } from 'express';
import type { ChatMessageDTO } from '@uaetrail/shared-types';
import { getRedisClient } from '../lib/redis.js';

const CHAT_REDIS_CHANNEL = 'chat:stream';
const HEARTBEAT_MS = 25_000;

export type ChatStreamEvent =
  | { type: 'chat_message'; data: ChatMessageDTO }
  | { type: 'ping' };

interface SseClient {
  res: Response;
  heartbeat: ReturnType<typeof setInterval>;
}

const clientsByUser = new Map<string, Set<SseClient>>();
let redisSubscriber: Awaited<ReturnType<typeof getRedisClient>> | null = null;
let pubSubReady = false;

const writeSse = (res: Response, event: ChatStreamEvent): void => {
  if (res.writableEnded) return;
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event.type === 'ping' ? {} : event.data)}\n\n`);
};

const deliverLocal = (userId: string, event: ChatStreamEvent): void => {
  const clients = clientsByUser.get(userId);
  if (!clients?.size) return;
  for (const client of clients) {
    writeSse(client.res, event);
  }
};

export const registerChatStreamClient = (userId: string, res: Response): (() => void) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  writeSse(res, { type: 'ping' });

  const heartbeat = setInterval(() => {
    writeSse(res, { type: 'ping' });
  }, HEARTBEAT_MS);

  const client: SseClient = { res, heartbeat };
  const bucket = clientsByUser.get(userId) ?? new Set<SseClient>();
  bucket.add(client);
  clientsByUser.set(userId, bucket);

  return () => {
    clearInterval(heartbeat);
    bucket.delete(client);
    if (bucket.size === 0) {
      clientsByUser.delete(userId);
    }
  };
};

export const publishChatStreamEvent = async (
  userId: string,
  event: ChatStreamEvent
): Promise<void> => {
  const redis = await getRedisClient();
  if (redis) {
    await redis.publish(
      CHAT_REDIS_CHANNEL,
      JSON.stringify({ userId, event })
    );
    return;
  }

  deliverLocal(userId, event);
};

export const initChatStreamPubSub = async (): Promise<void> => {
  if (pubSubReady) return;

  const redis = await getRedisClient();
  if (!redis) {
    pubSubReady = true;
    return;
  }

  const subscriber = redis.duplicate();
  await subscriber.connect();
  redisSubscriber = subscriber as typeof redis;

  await subscriber.subscribe(CHAT_REDIS_CHANNEL, (message) => {
    try {
      const payload = JSON.parse(message) as { userId: string; event: ChatStreamEvent };
      if (payload.userId && payload.event) {
        deliverLocal(payload.userId, payload.event);
      }
    } catch {
      // ignore malformed pub/sub payloads
    }
  });

  pubSubReady = true;
};

export const closeChatStreamPubSub = async (): Promise<void> => {
  for (const clients of clientsByUser.values()) {
    for (const client of clients) {
      clearInterval(client.heartbeat);
      if (!client.res.writableEnded) {
        client.res.end();
      }
    }
  }
  clientsByUser.clear();

  if (redisSubscriber?.isOpen) {
    await redisSubscriber.quit();
  }
  redisSubscriber = null;
  pubSubReady = false;
};
