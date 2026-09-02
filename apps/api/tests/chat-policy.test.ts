import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { findAuthUserByEmail } from '../src/lib/auth-users.js';
import { getMongoClient } from '../src/lib/mongo.js';
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
let activityId = '';

beforeAll(async () => {
  app = await bootstrapTestApp();

  const suffix = `chat-${Date.now()}`;
  visitorA = await registerVerifiedVisitor(app, `${suffix}-a`);
  visitorB = await registerVerifiedVisitor(app, `${suffix}-b`);

  const fixture = await createPublishedEventFixture(suffix);
  organizerId = fixture.organizerId;
  activityId = fixture.activityId;
});

afterAll(async () => {
  const testUsers = await getMongoClient()!
    .db()
    .collection('auth_users')
    .find({ email: { $regex: /@test\.local$/ } }, { projection: { _id: 1 } })
    .toArray();
  const testUserIds = testUsers.map((user) => user._id as string);

  if (testUserIds.length > 0) {
    await getMongoClient()!
      .db()
      .collection('chat_messages')
      .deleteMany({
        $or: [{ senderId: { $in: testUserIds } }, { receiverId: { $in: testUserIds } }]
      });
  }

  await cleanupTestUsers();
});

describe('chat messaging policy', () => {
  it('blocks messages between users with no trip or thread relationship', async () => {
    const receiver = await findAuthUserByEmail(visitorB.email);
    expect(receiver).toBeTruthy();

    const response = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ receiverId: receiver!._id, content: 'Hello stranger' });

    expect(response.status).toBe(403);
    expect(response.body.error?.code).toBe('message_not_allowed');
  });

  it('allows messaging an organizer after a join request is submitted', async () => {
    const joinRes = await request(app)
      .post(`/api/v1/activities/${activityId}/requests`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ note: 'Would love to join' });

    expect(joinRes.status).toBe(201);

    const response = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ receiverId: organizerId, content: 'Hi organizer', activityId });

    expect(response.status).toBe(201);
    expect(response.body.data?.content).toBe('Hi organizer');
  });

  it('allows trip inquiry messages when activityId matches a published trip host', async () => {
    const response = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({
        receiverId: organizerId,
        content: 'Is this trip beginner friendly?',
        activityId
      });

    expect(response.status).toBe(201);
    expect(response.body.data?.content).toBe('Is this trip beginner friendly?');
  });
});
