import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY } from '@uaetrail/shared-types';
import { RequestStatus } from '../src/domain/enums.js';
import { findAuthUserByEmail } from '../src/lib/auth-users.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { newEntityId } from '../src/lib/entity-builders.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import {
  cleanupEventFixture,
  cleanupTestUsers,
  createPublishedEventFixture,
  registerVerifiedVisitor,
  type PublishedEventFixture,
} from './helpers/fixtures.js';

let app: Express;

type NotificationRow = {
  title?: string;
  body?: string;
  meta?: { kind?: string; activityId?: string; actorUserId?: string; path?: string };
};

const listNotifications = async (accessToken: string): Promise<NotificationRow[]> => {
  const res = await request(app)
    .get('/api/v1/me/notifications')
    .set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  return res.body.data as NotificationRow[];
};

const seedApprovedParticipant = async (
  fixture: PublishedEventFixture,
  userId: string
): Promise<void> => {
  const requestId = newEntityId();
  const now = new Date();
  const db = getMongoClient()!.db();
  await db.collection('activity_requests').insertOne({
    _id: requestId,
    activityId: fixture.activityId,
    userId,
    status: RequestStatus.APPROVED,
    createdAt: now,
    updatedAt: now
  });
  await db.collection('activity_participants').insertOne({
    _id: newEntityId(),
    activityId: fixture.activityId,
    userId,
    requestId,
    approvedById: fixture.organizerId,
    createdAt: now
  });
};

const loginOrganizer = async (suffix: string): Promise<string> => {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: `org-${suffix}@test.local`, password: 'TestPass1' });
  expect(login.status).toBe(200);
  return login.body.tokens.accessToken as string;
};

beforeAll(async () => {
  app = await bootstrapTestApp();
});

afterAll(async () => {
  await cleanupTestUsers();
});

describe('activity join invite', () => {
  it('lets host invite a member and delivers in-app notification', async () => {
    const suffix = `join-invite-${Date.now()}`;
    const fixture: PublishedEventFixture = await createPublishedEventFixture(suffix);
    const invitee = await registerVerifiedVisitor(app, `${suffix}-guest`);
    const inviteeUser = await findAuthUserByEmail(invitee.email);
    expect(inviteeUser).toBeTruthy();

    const hostToken = await loginOrganizer(suffix);

    const inviteRes = await request(app)
      .post(`/api/v1/activities/${fixture.activityId}/invites`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ inviteeUserId: inviteeUser!._id });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.status).toBe('pending');

    const notifications = await listNotifications(invitee.accessToken);
    const inviteNotif = notifications.find(
      (row) =>
        row.meta?.kind === 'activity_join_invite' && row.meta.activityId === fixture.activityId
    );
    expect(inviteNotif).toBeTruthy();
    expect(inviteNotif!.meta?.path).toBe(`/activity/${fixture.activityId}?invite=1`);
    expect(inviteNotif!.body).toMatch(/invited you to join/);
    expect(inviteNotif!.body).toMatch(/Tap to view and join/);

    const detailRes = await request(app)
      .get(`/api/v1/activities/${fixture.activityId}`)
      .set('Authorization', `Bearer ${invitee.accessToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.myJoinInvite?.fromUserId).toBeTruthy();
    expect(detailRes.body.data.myJoinInvite?.inviterDisplayName).toBeTruthy();

    await cleanupEventFixture(fixture);
    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.ACTIVITY_INVITES)
      .deleteMany({ activityId: fixture.activityId });
  });

  it('lists pending invites sent by the host', async () => {
    const suffix = `join-invite-list-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);
    const invitee = await registerVerifiedVisitor(app, `${suffix}-guest`);
    const inviteeUser = await findAuthUserByEmail(invitee.email);
    expect(inviteeUser).toBeTruthy();

    const hostToken = await loginOrganizer(suffix);

    const inviteRes = await request(app)
      .post(`/api/v1/activities/${fixture.activityId}/invites`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ inviteeUserId: inviteeUser!._id });
    expect(inviteRes.status).toBe(201);

    const listRes = await request(app)
      .get(`/api/v1/activities/${fixture.activityId}/invites`)
      .set('Authorization', `Bearer ${hostToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.inviteeUserIds).toContain(inviteeUser!._id);

    await cleanupEventFixture(fixture);
    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.ACTIVITY_INVITES)
      .deleteMany({ activityId: fixture.activityId });
  });

  it('lets an approved participant invite a member', async () => {
    const suffix = `join-invite-participant-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);
    const going = await registerVerifiedVisitor(app, `${suffix}-going`);
    const goingUser = await findAuthUserByEmail(going.email);
    expect(goingUser).toBeTruthy();
    await seedApprovedParticipant(fixture, goingUser!._id);

    const invitee = await registerVerifiedVisitor(app, `${suffix}-invitee`);
    const inviteeUser = await findAuthUserByEmail(invitee.email);
    expect(inviteeUser).toBeTruthy();

    const inviteRes = await request(app)
      .post(`/api/v1/activities/${fixture.activityId}/invites`)
      .set('Authorization', `Bearer ${going.accessToken}`)
      .send({ inviteeUserId: inviteeUser!._id });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.status).toBe('pending');

    await cleanupEventFixture(fixture);
    await getMongoClient()!
      .db()
      .collection(COLLECTIONS.ACTIVITY_INVITES)
      .deleteMany({ activityId: fixture.activityId });
  });

  it('rate limits new invites per activity per day', async () => {
    const suffix = `join-invite-limit-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);
    const hostToken = await loginOrganizer(suffix);
    const target = await registerVerifiedVisitor(app, `${suffix}-target`);
    const targetUser = await findAuthUserByEmail(target.email);
    expect(targetUser).toBeTruthy();

    const now = new Date();
    const db = getMongoClient()!.db();
    for (let i = 0; i < ACTIVITY_JOIN_INVITE_DAILY_LIMIT_PER_ACTIVITY; i++) {
      await db.collection(COLLECTIONS.ACTIVITY_INVITES).insertOne({
        _id: newEntityId(),
        activityId: fixture.activityId,
        fromUserId: fixture.organizerId,
        toUserId: `synthetic-invitee-${i}`,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    }

    const denyRes = await request(app)
      .post(`/api/v1/activities/${fixture.activityId}/invites`)
      .set('Authorization', `Bearer ${hostToken}`)
      .send({ inviteeUserId: targetUser!._id });
    expect(denyRes.status).toBe(429);
    expect(denyRes.body.error?.code).toBe('rate_limit');

    await cleanupEventFixture(fixture);
    await db.collection(COLLECTIONS.ACTIVITY_INVITES).deleteMany({ activityId: fixture.activityId });
  });

  it('rejects invites from members who are not host or going', async () => {
    const suffix = `join-invite-deny-${Date.now()}`;
    const fixture = await createPublishedEventFixture(suffix);
    const stranger = await registerVerifiedVisitor(app, `${suffix}-stranger`);
    const target = await registerVerifiedVisitor(app, `${suffix}-target`);
    const targetUser = await findAuthUserByEmail(target.email);
    expect(targetUser).toBeTruthy();

    const denyRes = await request(app)
      .post(`/api/v1/activities/${fixture.activityId}/invites`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .send({ inviteeUserId: targetUser!._id });

    expect(denyRes.status).toBe(403);

    await cleanupEventFixture(fixture);
  });
});
