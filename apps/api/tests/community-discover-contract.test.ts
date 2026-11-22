import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { GeoRef } from '@uaetrail/shared-types';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { findAuthUserByEmail } from '../src/lib/auth-users-store.js';
import { cleanupTestUsers, registerVerifiedPlatformAdmin, registerVerifiedVisitor } from './helpers/fixtures.js';
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
    expect(read('../../packages/shared-types/src/community-discover.ts')).toMatch(/compareCommunityDiscoverByGeo/);
    expect(read('../../packages/shared-types/src/community-discover.ts')).toMatch(/CommunityDiscoverDetailDTO/);
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
  });
});