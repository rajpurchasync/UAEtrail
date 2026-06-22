import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import {
  cleanupTestUsers,
  createPublishedEventFixture,
  registerVerifiedVisitor
} from './helpers/fixtures.js';

let app: Express;
let visitorA: { email: string; accessToken: string };
let visitorB: { email: string; accessToken: string };
let organizerId = '';
let eventId = '';

beforeAll(async () => {
  app = await bootstrapTestApp();

  const suffix = `chat-${Date.now()}`;
  visitorA = await registerVerifiedVisitor(app, `${suffix}-a`);
  visitorB = await registerVerifiedVisitor(app, `${suffix}-b`);

  const fixture = await createPublishedEventFixture(suffix);
  organizerId = fixture.organizerId;
  eventId = fixture.eventId;
});

afterAll(async () => {
  await prisma.chatMessage.deleteMany({
    where: {
      OR: [
        { sender: { email: { endsWith: '@test.local' } } },
        { receiver: { email: { endsWith: '@test.local' } } }
      ]
    }
  });
  await cleanupTestUsers();
});

describe('chat messaging policy', () => {
  it('blocks messages between users with no trip or thread relationship', async () => {
    const receiver = await prisma.user.findUnique({ where: { email: visitorB.email } });
    expect(receiver).toBeTruthy();

    const response = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ receiverId: receiver!.id, content: 'Hello stranger' });

    expect(response.status).toBe(403);
    expect(response.body.error?.code).toBe('message_not_allowed');
  });

  it('allows messaging an organizer after a join request is submitted', async () => {
    const joinRes = await request(app)
      .post(`/api/v1/events/${eventId}/requests`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ note: 'Would love to join' });

    expect(joinRes.status).toBe(201);

    const response = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ receiverId: organizerId, content: 'Hi organizer', eventId });

    expect(response.status).toBe(201);
    expect(response.body.data?.content).toBe('Hi organizer');
  });
});
