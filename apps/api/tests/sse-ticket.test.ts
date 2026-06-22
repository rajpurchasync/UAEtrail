import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/redis.js', () => ({
  getRedisClient: vi.fn(async () => null)
}));

const { resetSseTicketsForTests, createSseTicket, validateSseTicket } = await import(
  '../src/lib/sse-ticket.js'
);

describe('sse ticket', () => {
  beforeEach(() => {
    resetSseTicketsForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('issues a ticket that resolves to the owning user', async () => {
    const ticket = await createSseTicket('user-abc');
    await expect(validateSseTicket(ticket)).resolves.toBe('user-abc');
  });

  it('rejects unknown tickets', async () => {
    await expect(validateSseTicket('missing-ticket')).resolves.toBeNull();
  });
});
