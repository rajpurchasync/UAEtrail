import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { findAuthUserByEmail } from '../src/lib/auth-users.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { cleanupTestUsers, registerVerifiedVisitor } from './helpers/fixtures.js';

let app: Express;

type NotificationRow = {
  meta?: { kind?: string; requestId?: string; fromUserId?: string; actorUserId?: string };
};

const listNotifications = async (accessToken: string): Promise<NotificationRow[]> => {
  const res = await request(app)
    .get('/api/me/notifications')
    .set('Authorization', `Bearer ${accessToken}`);
  expect(res.status).toBe(200);
  return res.body.data as NotificationRow[];
};

beforeAll(async () => {
  app = await bootstrapTestApp();
});

afterAll(async () => {
  await cleanupTestUsers();
});

describe('connections API — buddy requests', () => {
  it('supports send, list, accept, relationship, and buddies list', async () => {
    const suffix = `conn-buddy-${Date.now()}`;
    const sender = await registerVerifiedVisitor(app, `${suffix}-from`);
    const recipient = await registerVerifiedVisitor(app, `${suffix}-to`);
    const recipientUser = await findAuthUserByEmail(recipient.email);
    expect(recipientUser).toBeTruthy();

    const sendRes = await request(app)
      .post('/api/me/buddy-requests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ targetUserId: recipientUser!._id, message: 'Trail buddies?' });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.status).toBe('pending');
    const requestId = sendRes.body.data.id as string;

    const incomingRes = await request(app)
      .get('/api/me/buddy-requests?direction=incoming')
      .set('Authorization', `Bearer ${recipient.accessToken}`);
    expect(incomingRes.status).toBe(200);
    expect(incomingRes.body.data.some((row: { id: string }) => row.id === requestId)).toBe(true);

    const outgoingRes = await request(app)
      .get('/api/me/buddy-requests?direction=outgoing')
      .set('Authorization', `Bearer ${sender.accessToken}`);
    expect(outgoingRes.status).toBe(200);
    expect(outgoingRes.body.data.some((row: { id: string }) => row.id === requestId)).toBe(true);

    const relBefore = await request(app)
      .get(`/api/me/buddy-relationship/${recipientUser!._id}`)
      .set('Authorization', `Bearer ${sender.accessToken}`);
    expect(relBefore.status).toBe(200);
    expect(relBefore.body.data.outgoingRequest?.id).toBe(requestId);
    expect(relBefore.body.data.canSendRequest).toBe(false);

    const acceptRes = await request(app)
      .post(`/api/me/buddy-requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${recipient.accessToken}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('accepted');

    const buddiesRes = await request(app)
      .get('/api/me/buddies')
      .set('Authorization', `Bearer ${sender.accessToken}`);
    expect(buddiesRes.status).toBe(200);
    expect(buddiesRes.body.data.some((row: { userId: string }) => row.userId === recipientUser!._id)).toBe(
      true
    );

    const senderFollowsRecipient = await request(app)
      .get(`/api/me/follow-state/${recipientUser!._id}`)
      .set('Authorization', `Bearer ${sender.accessToken}`);
    expect(senderFollowsRecipient.status).toBe(200);
    expect(senderFollowsRecipient.body.data.isFollowing).toBe(true);

    const recipientFollowsSender = await request(app)
      .get(`/api/me/follow-state/${(await findAuthUserByEmail(sender.email))!._id}`)
      .set('Authorization', `Bearer ${recipient.accessToken}`);
    expect(recipientFollowsSender.status).toBe(200);
    expect(recipientFollowsSender.body.data.isFollowing).toBe(true);
  });

  it('allows recipient to decline and sender to cancel outgoing pending', async () => {
    const suffix = `conn-decline-${Date.now()}`;
    const a = await registerVerifiedVisitor(app, `${suffix}-a`);
    const b = await registerVerifiedVisitor(app, `${suffix}-b`);
    const c = await registerVerifiedVisitor(app, `${suffix}-c`);
    const userB = await findAuthUserByEmail(b.email);
    const userC = await findAuthUserByEmail(c.email);
    expect(userB && userC).toBeTruthy();

    const toDecline = await request(app)
      .post('/api/me/buddy-requests')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ targetUserId: userB!._id });
    expect(toDecline.status).toBe(201);

    const declineRes = await request(app)
      .post(`/api/me/buddy-requests/${toDecline.body.data.id}/decline`)
      .set('Authorization', `Bearer ${b.accessToken}`);
    expect(declineRes.status).toBe(200);
    expect(declineRes.body.data.status).toBe('declined');

    const relAfterDecline = await request(app)
      .get(`/api/me/buddy-relationship/${userB!._id}`)
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(relAfterDecline.body.data.canSendRequest).toBe(true);

    const toCancel = await request(app)
      .post('/api/me/buddy-requests')
      .set('Authorization', `Bearer ${a.accessToken}`)
      .send({ targetUserId: userC!._id });
    expect(toCancel.status).toBe(201);

    const cancelRes = await request(app)
      .post(`/api/me/buddy-requests/${toCancel.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${a.accessToken}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('cancelled');

    const wrongCancel = await request(app)
      .post(`/api/me/buddy-requests/${toCancel.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${c.accessToken}`);
    expect(wrongCancel.status).toBe(409);
  });

  it('auto-accepts when the other user already sent a pending request', async () => {
    const suffix = `conn-reverse-${Date.now()}`;
    const first = await registerVerifiedVisitor(app, `${suffix}-1`);
    const second = await registerVerifiedVisitor(app, `${suffix}-2`);
    const userSecond = await findAuthUserByEmail(second.email);
    expect(userSecond).toBeTruthy();

    const initial = await request(app)
      .post('/api/me/buddy-requests')
      .set('Authorization', `Bearer ${first.accessToken}`)
      .send({ targetUserId: userSecond!._id });
    expect(initial.status).toBe(201);

    const reciprocal = await request(app)
      .post('/api/me/buddy-requests')
      .set('Authorization', `Bearer ${second.accessToken}`)
      .send({ targetUserId: (await findAuthUserByEmail(first.email))!._id });
    expect(reciprocal.status).toBe(200);
    expect(reciprocal.body.data.status).toBe('accepted');

    const unfriendRes = await request(app)
      .post(`/api/me/buddies/${userSecond!._id}/unfriend`)
      .set('Authorization', `Bearer ${first.accessToken}`);
    expect(unfriendRes.status).toBe(200);
  });

  it('dispatches buddy request and accepted notifications with expected meta', async () => {
    const suffix = `conn-buddy-notif-${Date.now()}`;
    const sender = await registerVerifiedVisitor(app, `${suffix}-from`);
    const recipient = await registerVerifiedVisitor(app, `${suffix}-to`);
    const senderUser = await findAuthUserByEmail(sender.email);
    const recipientUser = await findAuthUserByEmail(recipient.email);
    expect(senderUser && recipientUser).toBeTruthy();

    const sendRes = await request(app)
      .post('/api/me/buddy-requests')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ targetUserId: recipientUser!._id });
    expect(sendRes.status).toBe(201);
    const requestId = sendRes.body.data.id as string;

    const recipientNotifs = await listNotifications(recipient.accessToken);
    const requestNotifs = recipientNotifs.filter((n) => n.meta?.kind === 'connection_buddy_request');
    expect(requestNotifs.length).toBe(1);
    expect(requestNotifs[0]?.meta?.requestId).toBe(requestId);
    expect(requestNotifs[0]?.meta?.actorUserId).toBe(senderUser!._id);

    const acceptRes = await request(app)
      .post(`/api/me/buddy-requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${recipient.accessToken}`);
    expect(acceptRes.status).toBe(200);

    const senderNotifs = await listNotifications(sender.accessToken);
    const acceptedNotifs = senderNotifs.filter((n) => n.meta?.kind === 'connection_buddy_accepted');
    expect(acceptedNotifs.length).toBe(1);
    expect(acceptedNotifs[0]?.meta?.requestId).toBe(requestId);
    expect(acceptedNotifs[0]?.meta?.actorUserId).toBe(recipientUser!._id);
  });
});

describe('connections API — follow', () => {
  it('follows, lists, and creates a follower notification once', async () => {
    const suffix = `conn-follow-${Date.now()}`;
    const follower = await registerVerifiedVisitor(app, `${suffix}-follower`);
    const target = await registerVerifiedVisitor(app, `${suffix}-target`);
    const targetUser = await findAuthUserByEmail(target.email);
    expect(targetUser).toBeTruthy();

    const followRes = await request(app)
      .post(`/api/me/following/${targetUser!._id}`)
      .set('Authorization', `Bearer ${follower.accessToken}`);
    expect(followRes.status).toBe(201);
    expect(followRes.body.data.isFollowing).toBe(true);

    const duplicateFollow = await request(app)
      .post(`/api/me/following/${targetUser!._id}`)
      .set('Authorization', `Bearer ${follower.accessToken}`);
    expect(duplicateFollow.status).toBe(201);

    const targetNotifs = await listNotifications(target.accessToken);
    const followNotifs = targetNotifs.filter((n) => n.meta?.kind === 'connection_member_followed');
    expect(followNotifs.length).toBe(1);

    const listRes = await request(app)
      .get('/api/me/following')
      .set('Authorization', `Bearer ${follower.accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((row: { userId: string }) => row.userId === targetUser!._id)).toBe(true);

    const unfollowRes = await request(app)
      .delete(`/api/me/following/${targetUser!._id}`)
      .set('Authorization', `Bearer ${follower.accessToken}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body.data.isFollowing).toBe(false);
  });
});

describe('connections API — groups', () => {
  it('lets a non-admin member leave; admins remove others; owner cannot leave', async () => {
    const suffix = `conn-group-${Date.now()}`;
    const admin = await registerVerifiedVisitor(app, `${suffix}-admin`);
    const member = await registerVerifiedVisitor(app, `${suffix}-member`);
    const memberUser = await findAuthUserByEmail(member.email);
    expect(memberUser).toBeTruthy();

    const createRes = await request(app)
      .post('/api/me/groups')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ type: 'friends', name: `Leave test ${suffix}` });
    expect(createRes.status).toBe(201);
    const groupId = createRes.body.data.id as string;

    const inviteRes = await request(app)
      .post(`/api/me/groups/${groupId}/invites`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ email: member.email, role: 'buddy' });
    expect(inviteRes.status).toBe(201);

    const acceptRes = await request(app)
      .post('/api/me/group-invites/accept')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ token: inviteRes.body.data.token });
    expect(acceptRes.status).toBe(200);

    const memberDetail = await request(app)
      .get(`/api/me/groups/${groupId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(memberDetail.status).toBe(200);
    const memberMembershipId = memberDetail.body.data.membership.id as string;

    const selfLeaveRes = await request(app)
      .delete(`/api/me/groups/${groupId}/members/${memberMembershipId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(selfLeaveRes.status).toBe(200);
    expect(selfLeaveRes.body.data.removed).toBe(true);

    const blockedDetail = await request(app)
      .get(`/api/me/groups/${groupId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(blockedDetail.status).toBe(403);

    const adminDetail = await request(app)
      .get(`/api/me/groups/${groupId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminDetail.status).toBe(200);
    const adminMembershipId = adminDetail.body.data.membership.id as string;

    const ownerLeave = await request(app)
      .delete(`/api/me/groups/${groupId}/members/${adminMembershipId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(ownerLeave.status).toBe(403);
    expect(ownerLeave.body.error?.code).toBe('group_owner_cannot_leave');
  });
});
