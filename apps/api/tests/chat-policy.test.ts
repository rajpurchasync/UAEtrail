import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { findAuthUserByEmail } from '../src/lib/auth-users-store.js';
import { canMessageUser, filterInboxMessageablePartnerIds } from '../src/services/chat-policy.js';
import { createMerchantProfileForUser, updateManagedMerchantProfileById } from '../src/lib/shop-store.js';
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
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ receiverId: receiver!._id, content: 'Hello stranger' });

    expect(response.status).toBe(403);
    expect(response.body.error?.code).toBe('message_not_allowed');
  });

  it('allows messaging an organizer after a join request is submitted', async () => {
    const joinRes = await request(app)
      .post(`/api/activities/${activityId}/requests`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ note: 'Would love to join' });

    expect(joinRes.status).toBe(201);

    const response = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ receiverId: organizerId, content: 'Hi organizer', activityId });

    expect(response.status).toBe(201);
    expect(response.body.data?.content).toBe('Hi organizer');
  });

  it('allows activity inquiry messages when activityId matches a published activity host', async () => {
    const response = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({
        receiverId: organizerId,
        content: 'Is this activity beginner friendly?',
        activityId
      });

    expect(response.status).toBe(201);
    expect(response.body.data?.content).toBe('Is this activity beginner friendly?');
  });

  it('persists replyToMessageId and enriches reply preview in the thread', async () => {
    const parentRes = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({
        receiverId: organizerId,
        content: 'Quick question about the meetup point',
        activityId,
      });

    expect(parentRes.status).toBe(201);
    const parentId = parentRes.body.data?.id as string;

    const replyRes = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({
        receiverId: organizerId,
        content: 'Sorry — meant the parking lot.',
        replyToMessageId: parentId,
        activityId,
      });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data?.replyToMessageId).toBe(parentId);
    expect(replyRes.body.data?.replyToPreview?.messageId).toBe(parentId);
    expect(replyRes.body.data?.replyToPreview?.bodySnippet).toContain('meetup');

    const threadRes = await request(app)
      .get(`/api/chat/messages/${organizerId}`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`);

    expect(threadRes.status).toBe(200);
    const replyRow = (threadRes.body.data as { replyToMessageId?: string }[]).find(
      (row) => row.replyToMessageId === parentId
    );
    expect(replyRow).toBeTruthy();
  });

  it('blocks buddy-only messaging after unfriend, even when a thread already exists', async () => {
    const userA = await findAuthUserByEmail(visitorA.email);
    const userB = await findAuthUserByEmail(visitorB.email);
    expect(userA).toBeTruthy();
    expect(userB).toBeTruthy();

    const requestRes = await request(app)
      .post('/api/me/buddy-requests')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ targetUserId: userB!._id });

    expect(requestRes.status).toBe(201);

    const acceptRes = await request(app)
      .post(`/api/me/buddy-requests/${requestRes.body.data.id}/accept`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`);

    expect(acceptRes.status).toBe(200);

    const messageRes = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ receiverId: userB!._id, content: 'Hey buddy' });

    expect(messageRes.status).toBe(201);

    const unfriendRes = await request(app)
      .post(`/api/me/buddies/${userB!._id}/unfriend`)
      .set('Authorization', `Bearer ${visitorA.accessToken}`);

    expect(unfriendRes.status).toBe(200);

    const blockedSend = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ receiverId: userA!._id, content: 'Can we still chat?' });

    expect(blockedSend.status).toBe(403);
    expect(blockedSend.body.error?.code).toBe('message_not_allowed');

    const blockedRead = await request(app)
      .get(`/api/chat/messages/${userA!._id}`)
      .set('Authorization', `Bearer ${visitorB.accessToken}`);

    expect(blockedRead.status).toBe(403);
    expect(blockedRead.body.error?.code).toBe('message_not_allowed');
  });

  it('inbox batch policy matches canMessageUser for activity-linked partners', async () => {
    const visitor = await findAuthUserByEmail(visitorB.email);
    expect(visitor).toBeTruthy();

    // visitorB already has a pending join request on this activity from earlier cases in this file.
    const partnerIds = [organizerId, (await findAuthUserByEmail(visitorA.email))!._id];
    const batchAllowed = await filterInboxMessageablePartnerIds(visitor!._id, partnerIds);

    for (const partnerId of partnerIds) {
      const single = await canMessageUser(visitor!._id, partnerId);
      expect(batchAllowed.has(partnerId)).toBe(single);
    }

    const inboxRes = await request(app)
      .get('/api/chat/inbox')
      .set('Authorization', `Bearer ${visitorB.accessToken}`);
    expect(inboxRes.status).toBe(200);
    const directIds = (inboxRes.body.data?.direct ?? []).map((row: { userId: string }) => row.userId);
    expect(directIds).toContain(organizerId);
  });

  it('allows shop DMs and public phone only when the owner opts in', async () => {
    const owner = await findAuthUserByEmail(visitorA.email);
    const customer = await findAuthUserByEmail(visitorB.email);
    expect(owner && customer).toBeTruthy();

    const shop = await createMerchantProfileForUser(owner!._id, {
      shopName: `Inbound chat shop ${Date.now()}`,
      contactPhone: '+971500000009',
      allowInboundChat: false,
      showContactPhone: false,
    });

    const hidden = await request(app).get(`/api/shop/shops/${shop.id}`);
    expect(hidden.status).toBe(200);
    expect(hidden.body.data.contactPhone).toBeNull();
    expect(hidden.body.data.allowInboundChat).toBe(false);

    const blocked = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ receiverId: owner!._id, content: 'Do you stock filters?' });
    expect(blocked.status).toBe(403);
    expect(blocked.body.error?.code).toBe('message_not_allowed');

    await updateManagedMerchantProfileById(owner!._id, shop.id, {
      allowInboundChat: true,
      showContactPhone: true,
    });

    const visible = await request(app).get(`/api/shop/shops/${shop.id}`);
    expect(visible.body.data.contactPhone).toBe('+971500000009');
    expect(visible.body.data.allowInboundChat).toBe(true);

    const inbound = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorB.accessToken}`)
      .send({ receiverId: owner!._id, content: 'Do you stock filters?' });
    expect(inbound.status).toBe(201);

    const reply = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${visitorA.accessToken}`)
      .send({ receiverId: customer!._id, content: 'Yes — in store this week.' });
    expect(reply.status).toBe(201);
  });
});
