import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { GeoRef } from '@uaetrail/shared-types';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import { cleanupTestUsers } from './helpers/fixtures.js';
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
  names: { country, state: area, area },
  searchTokens: [country.toLowerCase(), area.toLowerCase()],
});

let app: Express;

beforeAll(async () => {
  app = await bootstrapTestApp();
});

afterAll(async () => {
  await cleanupTestUsers();
  await getMongoClient().db().collection(COLLECTIONS.COMMUNITY_GROUPS).deleteMany({});
});

describe('community discover (MIG-COMMUNITY-DISCOVER)', () => {
  it('registrar exposes GET /explore/communities', () => {
    expect(read('src/routes/user/registerExploreCommunityRoutes.ts')).toMatch(/\/explore\/communities/);
    expect(read('src/routes/user/composeUserPublicRoutes.ts')).toMatch(/registerExploreCommunityRoutes/);
    expect(read('src/lib/collections.ts')).toMatch(/COMMUNITY_GROUPS: 'community_groups'/);
    expect(read('../../packages/shared-types/src/community-discover.ts')).toMatch(/compareCommunityDiscoverByGeo/);
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
});