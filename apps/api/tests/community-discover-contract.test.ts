import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { GeoRef } from '@uaetrail/shared-types';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { findAuthUserByEmail } from '../src/lib/auth-users-store.js';
import {
  cleanupTestUsers,
  createPublishedEventFixture,
  registerVerifiedPlatformAdmin,
  registerVerifiedVisitor,
} from './helpers/fixtures.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

const sampleGeo = (country: string, area: string): GeoRef => ({
  chain: [],
  countryId: 'ae',
  stateId: 'dxb',
  areaId: 'area-1',
  path: `${country}/${area}`,
  names: { country, state: area, area: area },
  searchTokens: [country.toLowerCase(), area.toLowerCase()],
});

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

  afterAll(async () => {
    await cleanupTestUsers();
    const db = getMongoClient().db();
    await db.collection(COLLECTIONS.COMMUNITY_GROUP_INVITES).deleteMany({});
    await db.collection(COLLECTIONS.COMMUNITY_GROUP_ADMINS).deleteMany({});
    await db.collection(COLLECTIONS.COMMUNITY_GROUP_MEMBERS).deleteMany({});
    await db.collection(COLLECTIONS.COMMUNITY_GROUPS).deleteMany({});
  });

describe('community discover (MIG-COMMUNITY-DISCOVER)', () => {
  it('registrar exposes GET /explore/communities', () => {
    expect(read('src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/explore\/communities/);
    expect(read('src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/explore\/communities\/:slug/);
    expect(read('src/routes/user/composeUserPublicRoutes.ts')).toMatch(/registerExploreCommunityRoutes/);
    expect(read('src/routes/user/composeUserMemberRoutes.ts')).toMatch(/registerMeCommunityDiscoverRoutes/);
    expect(read('src/routes/admin/registerAdminCommunityRoutes.ts')).toMatch(/registerAdminCommunityRoutes/);
    expect(read('src/routes/admin.ts')).toMatch(/registerAdminCommunityRoutes/);
    expect(read('src/lib/collections.ts')).toMatch(/COMMUNITY_GROUPS: 'community_groups'/);
    expect(read('src/lib/collections.ts')).toMatch(/COMMUNITY_GROUP_MEMBERS/);
    expect(read('src/lib/collections.ts')).toMatch(/COMMUNITY_GROUP_ADMINS/);
    expect(read('src/services/community-host-access.ts')).toMatch(/isCommunityAdministrator/);
    expect(read('src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/\/admins\/:userId/);
    expect(read('src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/\/status/);
    expect(read('../../packages/shared-types/src/community-discover.ts')).toMatch(/compareCommunityDiscoverByGeo/);
    expect(read('../../packages/shared-types/src/community-discover.ts')).toMatch(/CommunityDiscoverDetailDTO/);
    expect(read('../../packages/shared-types/src/community-discover.ts')).toMatch(/viewerIsHost/);
    expect(read('src/services/community-host-commands.ts')).toMatch(/leaveDiscoverableCommunity/);
    expect(read('src/services/community-host-read.ts')).toMatch(/loadCommunityHostManageSurface/);
    expect(read('src/services/community-host-notifications.ts')).toMatch(/notifyCommunityHostJoinRequest/);
    expect(read('src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/host-manage/);
    expect(read('src/routes/user/registerMeCommunityDiscoverRoutes.ts')).toMatch(/\/approve/);
    expect(read('src/lib/publishing-tenant-activity-schemas.ts')).toMatch(/discoverCommunityId/);
    expect(read('src/services/community-discover-publish-gate.ts')).toMatch(
      /assertDiscoverCommunityIdForActivityPublish/
    );
    expect(read('../../src/utils/notificationRouting.ts')).toMatch(/community_join_request/);
    expect(read('../../src/explore/ui/HostingCommunityPublishField.tsx')).toMatch(/discoverCommunityId/);
    expect(read('../../packages/shared-types/src/index.ts')).toMatch(/discoverCommunityId/);
    expect(read('../../src/explore/ui/hostingFromActivity.ts')).toMatch(/discoverCommunityId/);
    expect(read('src/services/community-discover-activities-read.ts')).toMatch(/loadExploreCommunityDiscoverActivities/);
    expect(read('src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/explore\/communities\/:slug\/activities/);
  });

  it('lists public active communities sorted country → city', async () => {
    const col = getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUPS);
    await col.deleteMany({});
    const now = new Date();
    await col.insertMany([
      {
        _id: 'comm-dxb',
        name: 'Dubai Trail Crew',
        slug: 'dubai-trail-crew',
        summary: 'Weekend hikes',
        bannerUrl: null,
        visibility: 'public',
        joinPolicy: 'open',
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
        status: 'active',
        memberCount: 12,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'comm-mct',
        name: 'Muscat Outdoors',
        slug: 'muscat-outdoors',
        summary: null,
        bannerUrl: null,
        visibility: 'public',
        joinPolicy: 'request',
        geoRef: sampleGeo('Oman', 'Muscat'),
        status: 'active',
        memberCount: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'comm-private',
        name: 'Hidden',
        slug: 'hidden',
        summary: null,
        bannerUrl: null,
        visibility: 'private',
        joinPolicy: 'invite',
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
        status: 'active',
        memberCount: 1,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const res = await request(app).get('/api/explore/communities');
    expect(res.status).toBe(200);
    expect(res.body.data.map((row: { name: string }) => row.name)).toEqual([
      'Muscat Outdoors',
      'Dubai Trail Crew',
    ]);
  });

  it('loads detail by slug and supports open join', async () => {
    const col = getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUPS);
    await col.deleteMany({});
    const now = new Date();
    await col.insertOne({
      _id: 'comm-join-open',
      name: 'Open Hikers',
      slug: 'open-hikers',
      summary: 'All welcome',
      bannerUrl: null,
      visibility: 'public',
      joinPolicy: 'open',
      geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      status: 'active',
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const guestRes = await request(app).get('/api/explore/communities/open-hikers');
    expect(guestRes.status).toBe(200);
    expect(guestRes.body.data.name).toBe('Open Hikers');
    expect(guestRes.body.data.viewerMembership).toBeNull();

    const suffix = `comm-join-${Date.now()}`;
    const member = await registerVerifiedVisitor(app, suffix);

    const authedRes = await request(app)
      .get('/api/explore/communities/open-hikers')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(authedRes.status).toBe(200);
    expect(authedRes.body.data.viewerMembership).toBeNull();

    const joinRes = await request(app)
      .post('/api/me/communities/comm-join-open/join')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.status).toBe('member');

    const afterJoin = await request(app)
      .get('/api/explore/communities/open-hikers')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(afterJoin.body.data.viewerMembership).toEqual({ status: 'member' });
    expect(afterJoin.body.data.memberCount).toBe(1);
  });

  it('creates pending membership for request-policy communities', async () => {
    const col = getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUPS);
    const now = new Date();
    await col.insertOne({
      _id: 'comm-request',
      name: 'Request Club',
      slug: 'request-club',
      summary: null,
      bannerUrl: null,
      visibility: 'public',
      joinPolicy: 'request',
      geoRef: sampleGeo('Oman', 'Muscat'),
      status: 'active',
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const member = await registerVerifiedVisitor(app, `comm-req-${Date.now()}`);
    const joinRes = await request(app)
      .post('/api/me/communities/comm-request/join')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.status).toBe('pending');

    const detailRes = await request(app)
      .get('/api/explore/communities/request-club')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(detailRes.body.data.viewerMembership).toEqual({ status: 'pending' });
    expect(detailRes.body.data.memberCount).toBe(0);
  });

  it('allows admin to seed communities and approve pending members', async () => {
    const admin = await registerVerifiedPlatformAdmin(app, `comm-admin-${Date.now()}`);
    const suffix = `comm-seed-${Date.now()}`;
    const applicant = await registerVerifiedVisitor(app, suffix);
    const applicantUser = await findAuthUserByEmail(applicant.email);
    expect(applicantUser).toBeTruthy();

    const createRes = await request(app)
      .post('/api/admin/communities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Seeded Club',
        slug: `seeded-${suffix}`,
        summary: 'Admin seeded',
        visibility: 'public',
        joinPolicy: 'request',
        adminUserId: applicantUser!._id,
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      });
    expect(createRes.status).toBe(201);
    const communityId = createRes.body.data.id as string;

    const joinRes = await request(app)
      .post(`/api/me/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${applicant.accessToken}`);
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.status).toBe('pending');

    const approveRes = await request(app)
      .post(`/api/admin/communities/${communityId}/members/${applicantUser!._id}/approve`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('member');

    const detailRes = await request(app)
      .get(`/api/explore/communities/seeded-${suffix}`)
      .set('Authorization', `Bearer ${applicant.accessToken}`);
    expect(detailRes.body.data.viewerMembership).toEqual({ status: 'member' });
    expect(detailRes.body.data.memberCount).toBe(1);

    const adminDetailRes = await request(app)
      .get(`/api/admin/communities/${communityId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminDetailRes.status).toBe(200);
    expect(adminDetailRes.body.data.host?.email).toBe(applicant.email);

    const suspendRes = await request(app)
      .patch(`/api/admin/communities/${communityId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'suspended', comment: 'Policy review' });
    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe('suspended');

    const publicList = await request(app).get('/api/explore/communities');
    expect(publicList.body.data.some((row: { id: string }) => row.id === communityId)).toBe(false);
  });

  it('supports host profile patch, leave, and public description fields', async () => {
    const admin = await registerVerifiedPlatformAdmin(app, `comm-host-${Date.now()}`);
    const suffix = `host-${Date.now()}`;
    const host = await registerVerifiedVisitor(app, suffix);
    const hostUser = await findAuthUserByEmail(host.email);
    expect(hostUser).toBeTruthy();

    const createRes = await request(app)
      .post('/api/admin/communities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Host Edit Club',
        slug: `host-edit-${suffix}`,
        summary: 'Short',
        description: 'Long about',
        policies: 'Be kind',
        visibility: 'public',
        joinPolicy: 'open',
        adminUserId: hostUser!._id,
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      });
    expect(createRes.status).toBe(201);
    const communityId = createRes.body.data.id as string;
    const slug = createRes.body.data.slug as string;

    const guestDetail = await request(app).get(`/api/explore/communities/${slug}`);
    expect(guestDetail.body.data.description).toBe('Long about');
    expect(guestDetail.body.data.policies).toBe('Be kind');
    expect(guestDetail.body.data.viewerIsHost).toBe(false);

    const hostDetail = await request(app)
      .get(`/api/explore/communities/${slug}`)
      .set('Authorization', `Bearer ${host.accessToken}`);
    expect(hostDetail.body.data.viewerIsHost).toBe(true);

    const patchRes = await request(app)
      .patch(`/api/me/communities/${communityId}/profile`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ summary: 'Updated short', description: 'Updated long' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.summary).toBe('Updated short');

    const member = await registerVerifiedVisitor(app, `leave-${suffix}`);
    const joinRes = await request(app)
      .post(`/api/me/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(joinRes.status).toBe(201);

    const leaveRes = await request(app)
      .post(`/api/me/communities/${communityId}/leave`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.data.viewerMembership).toBeNull();
    expect(leaveRes.body.data.memberCount).toBe(0);
  });

  it('invite-only communities require invite before join', async () => {
    const admin = await registerVerifiedPlatformAdmin(app, `comm-inv-${Date.now()}`);
    const suffix = `invite-${Date.now()}`;
    const member = await registerVerifiedVisitor(app, suffix);
    const memberUser = await findAuthUserByEmail(member.email);
    expect(memberUser).toBeTruthy();

    const createRes = await request(app)
      .post('/api/admin/communities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Invite Club',
        slug: `invite-club-${suffix}`,
        visibility: 'public',
        joinPolicy: 'invite',
        adminUserId: memberUser!._id,
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      });
    const communityId = createRes.body.data.id as string;

    const blockedJoin = await request(app)
      .post(`/api/me/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(blockedJoin.status).toBe(403);

    const inviteRes = await request(app)
      .post(`/api/admin/communities/${communityId}/invites`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: memberUser!._id });
    expect(inviteRes.status).toBe(201);

    const detailBefore = await request(app)
      .get(`/api/explore/communities/invite-club-${suffix}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(detailBefore.body.data.viewerHasInvite).toBe(true);

    const joinRes = await request(app)
      .post(`/api/me/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.status).toBe('member');
  });

  it('lists me communities and supports self-serve create', async () => {
    const suffix = `me-comm-${Date.now()}`;
    const member = await registerVerifiedVisitor(app, suffix);

    const emptyList = await request(app)
      .get('/api/me/communities')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(emptyList.status).toBe(200);
    expect(emptyList.body.data.created).toEqual([]);
    expect(emptyList.body.data.joined).toEqual([]);

    const createRes = await request(app)
      .post('/api/me/communities')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        name: 'My Trail Club',
        slug: `my-club-${suffix}`,
        visibility: 'public',
        joinPolicy: 'request',
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.detail.viewerIsHost).toBe(true);
    expect(createRes.body.data.detail.viewerMembership).toEqual({ status: 'member' });

    const listRes = await request(app)
      .get('/api/me/communities')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(listRes.body.data.created).toHaveLength(1);
    expect(listRes.body.data.created[0].slug).toBe(`my-club-${suffix}`);
  });

  it('lists linked community outings and host can link a published activity', async () => {
    const admin = await registerVerifiedPlatformAdmin(app, `comm-out-${Date.now()}`);
    const suffix = `out-${Date.now()}`;
    const host = await registerVerifiedVisitor(app, suffix);
    const hostUser = await findAuthUserByEmail(host.email);
    expect(hostUser).toBeTruthy();

    const createRes = await request(app)
      .post('/api/admin/communities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Outing Club',
        slug: `outing-club-${suffix}`,
        visibility: 'public',
        joinPolicy: 'open',
        adminUserId: hostUser!._id,
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      });
    expect(createRes.status).toBe(201);
    const communityId = createRes.body.data.id as string;
    const slug = createRes.body.data.slug as string;

    const fixture = await createPublishedEventFixture(`${suffix}-linked`);
    await getMongoClient()
      .db()
      .collection(COLLECTIONS.ACTIVITIES)
      .updateOne({ _id: fixture.activityId }, { $set: { discoverCommunityId: communityId, hostId: hostUser!._id } });

    const listRes = await request(app).get(`/api/explore/communities/${slug}/activities`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.upcoming.some((row: { id: string }) => row.id === fixture.activityId)).toBe(true);

    const extra = await createPublishedEventFixture(`${suffix}-linkme`);
    await getMongoClient()
      .db()
      .collection(COLLECTIONS.ACTIVITIES)
      .updateOne({ _id: extra.activityId }, { $set: { hostId: hostUser!._id, createdById: hostUser!._id } });

    const linkRes = await request(app)
      .post(`/api/me/communities/${communityId}/activities/${extra.activityId}/link`)
      .set('Authorization', `Bearer ${host.accessToken}`);
    expect(linkRes.status).toBe(200);
    expect(linkRes.body.data.discoverCommunityId).toBe(communityId);

    const afterLink = await request(app).get(`/api/explore/communities/${slug}/activities`);
    expect(afterLink.body.data.upcoming.some((row: { id: string }) => row.id === extra.activityId)).toBe(true);
  });

  it('host can load manage surface and approve pending join requests', async () => {
    const admin = await registerVerifiedPlatformAdmin(app, `comm-host-${Date.now()}`);
    const suffix = `host-appr-${Date.now()}`;
    const host = await registerVerifiedVisitor(app, `${suffix}-host`);
    const joiner = await registerVerifiedVisitor(app, `${suffix}-joiner`);
    const hostUser = await findAuthUserByEmail(host.email);
    const joinerUser = await findAuthUserByEmail(joiner.email);
    expect(hostUser).toBeTruthy();
    expect(joinerUser).toBeTruthy();

    const createRes = await request(app)
      .post('/api/admin/communities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Host Approve Club',
        slug: `host-appr-${suffix}`,
        visibility: 'public',
        joinPolicy: 'request',
        adminUserId: hostUser!._id,
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      });
    expect(createRes.status).toBe(201);
    const communityId = createRes.body.data.id as string;
    const slug = createRes.body.data.slug as string;

    const joinRes = await request(app)
      .post(`/api/me/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${joiner.accessToken}`);
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.data.status).toBe('pending');

    const forbidden = await request(app)
      .get(`/api/me/communities/${communityId}/host-manage`)
      .set('Authorization', `Bearer ${joiner.accessToken}`);
    expect(forbidden.status).toBe(403);

    const manageRes = await request(app)
      .get(`/api/me/communities/${communityId}/host-manage`)
      .set('Authorization', `Bearer ${host.accessToken}`);
    expect(manageRes.status).toBe(200);
    expect(manageRes.body.data.pending).toHaveLength(1);
    expect(manageRes.body.data.pending[0].userId).toBe(joinerUser!._id);

    const approveRes = await request(app)
      .post(`/api/me/communities/${communityId}/members/${joinerUser!._id}/approve`)
      .set('Authorization', `Bearer ${host.accessToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.viewerIsHost).toBe(true);
    expect(approveRes.body.data.memberCount).toBe(1);

    const afterManage = await request(app)
      .get(`/api/me/communities/${communityId}/host-manage`)
      .set('Authorization', `Bearer ${host.accessToken}`);
    expect(afterManage.body.data.pending).toHaveLength(0);
    expect(afterManage.body.data.members.some((row: { userId: string }) => row.userId === joinerUser!._id)).toBe(
      true
    );

    const joinerDetail = await request(app)
      .get(`/api/explore/communities/${slug}`)
      .set('Authorization', `Bearer ${joiner.accessToken}`);
    expect(joinerDetail.body.data.viewerMembership).toEqual({ status: 'member' });
  });

  it('owner can add co-host, co-host can approve, and host can pause community', async () => {
    const admin = await registerVerifiedPlatformAdmin(app, `comm-coadmin-${Date.now()}`);
    const suffix = `coadmin-${Date.now()}`;
    const host = await registerVerifiedVisitor(app, `${suffix}-host`);
    const helper = await registerVerifiedVisitor(app, `${suffix}-helper`);
    const hostUser = await findAuthUserByEmail(host.email);
    const helperUser = await findAuthUserByEmail(helper.email);
    expect(hostUser).toBeTruthy();
    expect(helperUser).toBeTruthy();

    const createRes = await request(app)
      .post('/api/admin/communities')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Co-host Club',
        slug: `coadmin-club-${suffix}`,
        visibility: 'public',
        joinPolicy: 'request',
        adminUserId: hostUser!._id,
        geoRef: sampleGeo('United Arab Emirates', 'Dubai'),
      });
    expect(createRes.status).toBe(201);
    const communityId = createRes.body.data.id as string;
    const slug = createRes.body.data.slug as string;

    const helperJoin = await request(app)
      .post(`/api/me/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${helper.accessToken}`);
    expect(helperJoin.status).toBe(201);
    await request(app)
      .post(`/api/me/communities/${communityId}/members/${helperUser!._id}/approve`)
      .set('Authorization', `Bearer ${host.accessToken}`);

    const addCoHost = await request(app)
      .post(`/api/me/communities/${communityId}/admins/${helperUser!._id}`)
      .set('Authorization', `Bearer ${host.accessToken}`);
    expect(addCoHost.status).toBe(201);
    expect(addCoHost.body.data.admins.some((row: { userId: string; role: string }) => row.userId === helperUser!._id && row.role === 'admin')).toBe(true);

    const newJoiner = await registerVerifiedVisitor(app, `${suffix}-pending`);
    const newJoinerUser = await findAuthUserByEmail(newJoiner.email);
    await request(app)
      .post(`/api/me/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${newJoiner.accessToken}`);

    const coApprove = await request(app)
      .post(`/api/me/communities/${communityId}/members/${newJoinerUser!._id}/approve`)
      .set('Authorization', `Bearer ${helper.accessToken}`);
    expect(coApprove.status).toBe(200);
    expect(coApprove.body.data.viewerIsHost).toBe(true);

    const suspend = await request(app)
      .patch(`/api/me/communities/${communityId}/status`)
      .set('Authorization', `Bearer ${host.accessToken}`)
      .send({ status: 'suspended' });
    expect(suspend.status).toBe(200);
    expect(suspend.body.data.status).toBe('suspended');

    const publicList = await request(app).get('/api/explore/communities');
    expect(publicList.body.data.some((row: { slug: string }) => row.slug === slug)).toBe(false);

    const hostDetail = await request(app)
      .get(`/api/explore/communities/${slug}`)
      .set('Authorization', `Bearer ${host.accessToken}`);
    expect(hostDetail.status).toBe(200);
    expect(hostDetail.body.data.status).toBe('suspended');

    const reactivate = await request(app)
      .patch(`/api/me/communities/${communityId}/status`)
      .set('Authorization', `Bearer ${helper.accessToken}`)
      .send({ status: 'active' });
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.data.status).toBe('active');
  });
});