import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';

const redisPublish = vi.fn(async () => 1);

vi.mock('../src/lib/redis.js', () => ({
  getRedisClient: vi.fn(async () => ({
    publish: redisPublish
  }))
}));

const { publishChatStreamActivity, registerChatStreamClient } = await import(
  '../src/services/chat-stream.js'
);

const createMockResponse = () => {
  const chunks: string[] = [];
  const res = {
    writableEnded: false,
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn((chunk: string) => {
      chunks.push(chunk);
      return true;
    }),
    end: vi.fn()
  } as unknown as Response;

  return { res, chunks };
};

describe('chat stream publish', () => {
  beforeEach(() => {
    redisPublish.mockClear();
  });

  it('publishes through redis without double-writing locally', async () => {
    const { res, chunks } = createMockResponse();
    const unregister = registerChatStreamClient('receiver-1', res);

    await publishChatStreamEvent('receiver-1', {
      type: 'chat_message',
      data: {
        id: 'msg-1',
        senderId: 'sender-1',
        receiverId: 'receiver-1',
        content: 'Hello',
        createdAt: new Date().toISOString()
      }
    });

    expect(redisPublish).toHaveBeenCalledTimes(1);
    expect(chunks.join('')).not.toContain('Hello');

    unregister();
  });
});
