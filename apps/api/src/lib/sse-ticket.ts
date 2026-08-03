import crypto from 'crypto';
import { getRedisClient } from './redis.js';

export const SSE_TICKET_TTL_SECONDS = 300;

const memoryTickets = new Map<string, { userId: string; expiresAt: number }>();

const ticketKey = (ticket: string) => `sse_ticket:${ticket}`;

export async function createSseTicket(userId: string): Promise<string> {
  const ticket = crypto.randomBytes(24).toString('hex');
  const redis = await getRedisClient();
  if (redis) {
    await redis.setEx(ticketKey(ticket), SSE_TICKET_TTL_SECONDS, userId);
    return ticket;
  }

  memoryTickets.set(ticket, {
    userId,
    expiresAt: Date.now() + SSE_TICKET_TTL_SECONDS * 1000
  });
  return ticket;
}

/** Validate and consume a single-use SSE ticket. */
export async function validateSseTicket(ticket: string): Promise<string | null> {
  const redis = await getRedisClient();
  if (redis) {
    const userId = await redis.getDel(ticketKey(ticket));
    return userId;
  }

  const entry = memoryTickets.get(ticket);
  memoryTickets.delete(ticket);
  if (!entry || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.userId;
}

export const resetSseTicketsForTests = (): void => {
  memoryTickets.clear();
};
