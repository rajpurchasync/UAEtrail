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
    await getMongoClient()!
      .db()
      .collection('buddy_pairs')
      .deleteMany({ userIds: { $in: testUserIds } });
    await getMongoClient()!
      .db()
      .collection('buddy_requests')
      .deleteMany({
        $or: [{ fromUserId: { $in: testUserIds } }, { toUserId: { $in: testUserIds } }]
      });
  }

  await cleanupTestUsers();
});

describe('chat messaging policy', () => {
  it('blocks messages between users with no activity or thread relationship', async () => {
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

  it('allows activity inquiry messages when activityId matches a published activity host', async () => {
    const response = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({
        receiverId: organizerId,
        content: 'Is this activity beginner friendly?',
        activityId
      });

    expect(response.status).toBe(201);
    expect(response.body.data?.content).toBe('Is this activity beginner friendly?');
  });

  it('blocks buddy-only messaging after unfriend, even when a thread already exists', async () => {
    const userA = await findAuthUserByEmail(visitorA.email);
    const userB = await findAuthUserByEmail(visitorB.email);
    expect(userA).toBeTruthy();
    expect(userB).toBeTruthy();

    const requestRes = await request(app)
      .post('/api/v1/me/buddy-requests')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ targetUserId: userB!._id });

    expect(requestRes.status).toBe(201);

    const acceptRes = await request(app)
      .post(`/api/v1/me/buddy-requests/${requestRes.body.data.id}/accept`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`);

    expect(acceptRes.status).toBe(200);

    const messageRes = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ receiverId: userB!._id, content: 'Hey buddy' });

    expect(messageRes.status).toBe(201);

    const unfriendRes = await request(app)
      .post(`/api/v1/me/buddies/${userB!._id}/unfriend`)
      .set('Authorization', `Bearer ${visitorA.accessToken}`);

    expect(unfriendRes.status).toBe(200);

    const blockedSend = await request(app)
      .post('/api/v1/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ receiverId: userA!._id, content: 'Can we still chat?' });

    expect(blockedSend.status).toBe(403);
    expect(blockedSend.body.error?.code).toBe('message_not_allowed');

    const blockedRead = await request(app)
      .get(`/api/v1/chat/messages/${userA!._id}`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`);

    expect(blockedRead.status).toBe(403);
    expect(blockedRead.body.error?.code).toBe('message_not_allowed');
  });
});
