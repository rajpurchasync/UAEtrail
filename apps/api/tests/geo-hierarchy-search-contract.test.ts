import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ActivityStatus, ActivityType, LocationStatus } from '../src/domain/enums.js';
import { createLocationRecord } from '../src/lib/activities-store.js';
import { bootstrapTestApp, configureTestEnv } from './helpers/bootstrap.js';
import { registerVerifiedPlatformAdmin, registerVerifiedVisitor } from './helpers/fixtures.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { seedGeoNodesFromCatalog } from '../src/lib/geo-backfill.js';
import { invalidateGeoTree } from '../src/lib/geo-tree.js';
import { buildDedupeKeys } from '@uaetrail/shared-types';

let app: Express;

beforeAll(async () => {
  configureTestEnv();
  app = await bootstrapTestApp();
  const db = getMongoClient()!.db();
  await db.collection(COLLECTIONS.GEO_NODES).deleteMany({});
  await seedGeoNodesFromCatalog(db);
  invalidateGeoTree();
});

describe('geo hierarchy + country/area/venue search', () => {
  it('GET /geo/tree and GET /geo/resolve return hierarchy nodes', async () => {
    const tree = await request(app).get('/api/geo/tree');
    expect(tree.status).toBe(200);
    expect(tree.body.data.nodes.length).toBeGreaterThan(0);
    expect(tree.body.data.nodes.some((n: { kind: string }) => n.kind === 'country')).toBe(true);

    const resolved = await request(app).get('/api/geo/resolve').query({ lat: 25.2, lng: 55.27 });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.geoRef.names.country).toMatch(/United Arab Emirates|UAE/i);
    expect(resolved.body.data.geoRef.searchTokens.length).toBeGreaterThan(0);
    expect(resolved.body.data.geoRef.areaId).toBeTruthy();

    const hattaDam = await request(app).get('/api/geo/resolve').query({ lat: 24.7847, lng: 56.1136 });
    expect(hattaDam.status).toBe(200);
    expect(hattaDam.body.data.geoRef.areaId).toBeTruthy();
    expect(hattaDam.body.data.geoRef.names.area).toMatch(/Hatta/i);
    expect(hattaDam.body.data.geoRef.venueId).toBeTruthy();
    expect(hattaDam.body.data.geoRef.names.venue).toMatch(/Hatta Dam/i);
  });

  it('UAE country children are the seven emirates; Al Ain is an Abu Dhabi area', async () => {
    const tree = await request(app).get('/api/geo/tree');
    expect(tree.status).toBe(200);
    const nodes = tree.body.data.nodes as Array<{
      id: string;
      kind: string;
      s: string;
      n: string;
      p: string | null;
      path: string;
    }>;
    const country = nodes.find((n) => n.kind === 'country');
    expect(country?.id).toBe('geo-country-ae');
    const emirates = nodes.filter((n) => n.kind === 'state' && n.p === country?.id);
    expect(emirates).toHaveLength(7);
    expect(emirates.some((n) => n.s === 'al-ain' || n.n === 'Al Ain')).toBe(false);
    expect(emirates.map((n) => n.s).sort()).toEqual(
      ['abu-dhabi', 'ajman', 'dubai', 'fujairah', 'rak', 'sharjah', 'umm-al-quwain'].sort()
    );

    const alAin = nodes.find((n) => n.s === 'al-ain');
    expect(alAin?.kind).toBe('area');
    expect(alAin?.id).toBe('geo-area-ae-abu-dhabi-al-ain');
    expect(alAin?.p).toBe('geo-state-ae-abu-dhabi');
    expect(alAin?.path).toBe('ae/abu-dhabi/al-ain');

    const hatta = nodes.find((n) => n.s === 'hatta' && n.kind === 'area');
    expect(hatta?.p).toBe('geo-state-ae-dubai');
    expect(hatta?.path).toMatch(/ae\/dubai\/hatta/);

    const inCity = await request(app).get('/api/geo/resolve').query({ lat: 24.21, lng: 55.76 });
    expect(inCity.status).toBe(200);
    expect(inCity.body.data.geoRef.stateId).toBe('geo-state-ae-abu-dhabi');
    expect(inCity.body.data.geoRef.names.state).toMatch(/Abu Dhabi/i);

    const legacy = await request(app).get('/api/geo/geo-state-ae-al-ain/summary');
    expect(legacy.status).toBe(200);
    expect(legacy.body.data.node.kind).toBe('area');
    expect(legacy.body.data.node.id).toBe('geo-area-ae-abu-dhabi-al-ain');
    expect(legacy.body.data.node.n).toMatch(/Al Ain/i);

    await seedGeoNodesFromCatalog(getMongoClient()!.db());
    const again = await request(app).get('/api/geo/tree');
    const statesAgain = (again.body.data.nodes as Array<{ kind: string; p: string | null }>).filter(
      (n) => n.kind === 'state' && n.p === country?.id
    );
    expect(statesAgain).toHaveLength(7);
  });

  it('GET /explore/map?q=&country= finds spots by country, area, and venue name', async () => {
    const suffix = `geo-search-${Date.now()}`;
    const venueName = `Hatnub Ridge ${suffix}`;
    const created = await createLocationRecord({
      name: venueName,
      region: 'Dubai',
      activityType: ActivityType.HIKING,
      status: LocationStatus.ACTIVE,
      featured: false,
      latitude: 25.2048,
      longitude: 55.2708,
      countryCode: 'AE',
      images: ['https://example.com/geo-search-cover.jpg'],
      tags: ['hiking'],
      registryListed: true,
    });
    expect(created.geoRef?.names.country).toBeTruthy();
    await invalidateExploreMapCache();

    const byVenue = await request(app).get('/api/explore/map').query({ q: suffix });
    expect(byVenue.status).toBe(200);
    const venueHits = (byVenue.body.data.items as Array<{ id: string; title?: string }>).filter(
      (item) => item.id === `venue:${created.id}` || item.title?.includes(suffix)
    );
    expect(venueHits.length).toBeGreaterThan(0);

    const byCountry = await request(app).get('/api/explore/map').query({
      country: created.geoRef?.names.country ?? 'United Arab Emirates',
      q: suffix,
    });
    expect(byCountry.status).toBe(200);
    expect(
      (byCountry.body.data.items as Array<{ id: string }>).some((item) => item.id === `venue:${created.id}`)
    ).toBe(true);

    const byArea = await request(app).get('/api/explore/map').query({
      area: created.geoRef?.names.area || created.geoRef?.names.state || 'Dubai',
      q: suffix,
    });
    expect(byArea.status).toBe(200);
    expect(
      (byArea.body.data.items as Array<{ id: string }>).some((item) => item.id === `venue:${created.id}`)
    ).toBe(true);
  });

  it('member suggestion stays pending until admin approve', async () => {
    const suffix = `sub-${Date.now()}`;
    const member = await registerVerifiedVisitor(app, suffix);
    const admin = await registerVerifiedPlatformAdmin(app, suffix);
    const body = {
      kind: 'trail',
      name: `New wadi ${suffix}`,
      latitude: 25.21,
      longitude: 55.28,
      payload: { name: `New wadi ${suffix}` },
      candidates: [],
    };
    const created = await request(app)
      .post('/api/me/submissions')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send(body);
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('pending');

    const queue = await request(app)
      .get('/api/admin/submissions')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(queue.status).toBe(200);
    expect((queue.body.data as Array<{ id: string }>).some((row) => row.id === created.body.data.id)).toBe(
      true
    );
  });

  it('expectIndexed: geo searchTokens and submission cells use IXSCAN when hinted', async () => {
    const db = getMongoClient()!.db();
    const locIndexes = await db.collection(COLLECTIONS.LOCATIONS).indexes();
    expect(locIndexes.some((idx) => idx.name === 'geo_search_tokens')).toBe(true);
    expect(locIndexes.some((idx) => idx.name === 'dedupe_cells')).toBe(true);
    const subIndexes = await db.collection(COLLECTIONS.SUBMISSIONS).indexes();
    expect(subIndexes.some((idx) => idx.name === 'pending_near')).toBe(true);

    const locExplain = await db
      .collection(COLLECTIONS.LOCATIONS)
      .find({ 'geoRef.searchTokens': 'dubai' })
      .hint('geo_search_tokens')
      .explain('queryPlanner');
    expect(JSON.stringify(locExplain.queryPlanner.winningPlan)).toMatch(/IXSCAN/);

    const keys = buildDedupeKeys({
      name: 'example trail',
      geo: { type: 'Point', coordinates: [55.27, 25.2] },
      kind: 'trail',
    });
    const subExplain = await db
      .collection(COLLECTIONS.SUBMISSIONS)
      .find({ 'dedupe.cells': { $in: keys.cells }, status: 'pending' })
      .hint('pending_near')
      .explain('queryPlanner');
    expect(JSON.stringify(subExplain.queryPlanner.winningPlan)).toMatch(/IXSCAN/);
  });

  it('expectIndexed: hot paths are IXSCAN without COLLSCAN (unhinted)', async () => {
    const db = getMongoClient()!.db();
    const stagesOf = (plan: unknown, acc: string[] = []): string[] => {
      if (!plan || typeof plan !== 'object') return acc;
      const node = plan as { stage?: string; inputStage?: unknown; inputStages?: unknown[]; shards?: unknown[] };
      if (typeof node.stage === 'string') acc.push(node.stage);
      if (node.inputStage) stagesOf(node.inputStage, acc);
      if (Array.isArray(node.inputStages)) node.inputStages.forEach((stage) => stagesOf(stage, acc));
      if (Array.isArray(node.shards)) node.shards.forEach((stage) => stagesOf(stage, acc));
      return acc;
    };
    const expectIndexed = async (label: string, explain: { queryPlanner?: { winningPlan?: unknown } }) => {
      const stages = stagesOf(explain.queryPlanner?.winningPlan);
      expect(stages, `${label} stages ${stages.join(',')}`).not.toContain('COLLSCAN');
      expect(
        stages.some((stage) => stage === 'IXSCAN' || stage === 'IDHACK' || stage === 'EXPRESS_IXSCAN'),
        `${label} missing IXSCAN (${stages.join(',')})`
      ).toBe(true);
    };

    const activityIdExplain = await db
      .collection(COLLECTIONS.ACTIVITIES)
      .find({ _id: 'missing-activity-id' })
      .limit(1)
      .explain('queryPlanner');
    await expectIndexed('activity_by_id', activityIdExplain);

    const rebuildExplain = await db
      .collection(COLLECTIONS.ACTIVITIES)
      .find({ status: ActivityStatus.PUBLISHED, startAt: { $gte: new Date() } })
      .sort({ startAt: 1 })
      .limit(5)
      .explain('queryPlanner');
    await expectIndexed('explore_map_rebuild', rebuildExplain);

    const tokenExplain = await db
      .collection(COLLECTIONS.LOCATIONS)
      .find({ 'geoRef.searchTokens': 'dubai', status: LocationStatus.ACTIVE })
      .limit(5)
      .explain('queryPlanner');
    await expectIndexed('geoRef.searchTokens', tokenExplain);

    const keys = buildDedupeKeys({
      name: 'example trail',
      geo: { type: 'Point', coordinates: [55.27, 25.2] },
      kind: 'trail',
    });
    const cellsExplain = await db
      .collection(COLLECTIONS.SUBMISSIONS)
      .find({ 'dedupe.cells': { $in: keys.cells }, status: 'pending' })
      .limit(5)
      .explain('queryPlanner');
    await expectIndexed('submissions.cells', cellsExplain);

    const waitlistExplain = await db
      .collection(COLLECTIONS.ACTIVITY_REQUESTS)
      .find({ activityId: 'missing-activity-id', status: 'WAITLISTED' })
      .sort({ createdAt: 1 })
      .limit(1)
      .explain('queryPlanner');
    await expectIndexed('activity_requests.waitlist_promote', waitlistExplain);

    const alertExplain = await db
      .collection(COLLECTIONS.PLATFORM_ALERTS)
      .find({ active: true, startsAt: { $lte: new Date() }, endsAt: { $gte: new Date() } })
      .limit(5)
      .explain('queryPlanner');
    await expectIndexed('platform_alerts.active_window', alertExplain);

    const verificationExplain = await db
      .collection(COLLECTIONS.VERIFICATION_DOCUMENTS)
      .find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(20)
      .explain('queryPlanner');
    await expectIndexed('verification_documents.queue', verificationExplain);

    const placeUpcomingExplain = await db
      .collection(COLLECTIONS.ACTIVITIES)
      .find({ locationId: 'missing-place-id', status: ActivityStatus.PUBLISHED, startAt: { $gte: new Date() } })
      .sort({ startAt: 1 })
      .limit(5)
      .explain('queryPlanner');
    await expectIndexed('activities.by_place_upcoming', placeUpcomingExplain);

    const browseExplain = await db
      .collection(COLLECTIONS.ACTIVITIES)
      .find({
        status: ActivityStatus.PUBLISHED,
        activityType: ActivityType.HIKING,
        startAt: { $gte: new Date() },
      })
      .sort({ startAt: 1, _id: 1 })
      .limit(5)
      .explain('queryPlanner');
    await expectIndexed('activities.browse_upcoming', browseExplain);

    const reviewExplain = await db
      .collection(COLLECTIONS.SOCIAL_REVIEWS)
      .find({ targetType: 'place', targetId: 'missing-place-id' })
      .sort({ createdAt: -1 })
      .limit(5)
      .explain('queryPlanner');
    await expectIndexed('social_reviews.by_target', reviewExplain);

    try {
      const stats = await db
        .collection(COLLECTIONS.LOCATIONS)
        .aggregate([{ $indexStats: {} }])
        .toArray();
      for (const row of stats) {
        const accesses = (row as { accesses?: { ops?: number }; name?: string }).accesses?.ops ?? 0;
        const name = (row as { name?: string }).name;
        if (accesses === 0 && name && name !== '_id_') {
          console.warn(`[mongo-index-hygiene] warn unused index locations.${name}`);
        }
      }
    } catch {
      /* $indexStats unsupported on this server — warn-only */
    }
  });

  it('GET /geo/:id/summary rolls up descendant activities via subtree chain', async () => {
    const suffix = `geo-count-${Date.now()}`;
    const parentId = `geo-area-${suffix}`;
    const childId = `geo-venue-${suffix}`;
    const db = getMongoClient()!.db();
    const now = new Date();
    const startAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const endAt = new Date(now.getTime() + 26 * 60 * 60 * 1000);
    const center = { type: 'Point' as const, coordinates: [55.27, 25.2] as [number, number] };
    const bbox: [number, number, number, number] = [55.2, 25.1, 55.3, 25.3];

    await db.collection(COLLECTIONS.GEO_NODES).insertMany([
      {
        _id: parentId,
        level: 3,
        kind: 'area',
        slug: suffix,
        path: `test/${suffix}`,
        names: { en: `Parent ${suffix}` },
        ancestors: [],
        center,
        bbox,
        childCount: 1,
        sort: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: childId,
        level: 4,
        kind: 'venue',
        slug: `${suffix}-venue`,
        path: `test/${suffix}/venue`,
        names: { en: `Child ${suffix}` },
        parentId,
        ancestors: [parentId],
        center,
        bbox,
        childCount: 0,
        sort: 0,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    invalidateGeoTree();

    await db.collection(COLLECTIONS.ACTIVITIES).insertOne({
      _id: `act-${suffix}`,
      title: `Descendant outing ${suffix}`,
      status: ActivityStatus.PUBLISHED,
      activityType: ActivityType.HIKING,
      startAt,
      endAt,
      geoRef: {
        chain: [childId],
        countryId: 'geo-country-ae',
        stateId: 'geo-state-dubai',
        areaId: parentId,
        venueId: childId,
        path: `test/${suffix}/venue`,
        names: { country: 'UAE', state: 'Dubai', area: `Parent ${suffix}`, venue: `Child ${suffix}` },
        searchTokens: [suffix],
      },
    });
    await db.collection(COLLECTIONS.LOCATIONS).insertOne({
      _id: `place-${suffix}`,
      name: `Descendant place ${suffix}`,
      status: LocationStatus.ACTIVE,
      activityType: ActivityType.HIKING,
      geoRef: {
        chain: [childId],
        countryId: 'geo-country-ae',
        stateId: 'geo-state-dubai',
        areaId: parentId,
        venueId: childId,
        path: `test/${suffix}/venue`,
        names: { country: 'UAE', state: 'Dubai', area: `Parent ${suffix}`, venue: `Child ${suffix}` },
        searchTokens: [suffix],
      },
    });

    const parentSummary = await request(app).get(`/api/geo/${parentId}/summary`);
    expect(parentSummary.status).toBe(200);
    expect(parentSummary.body.data.counts.act.total).toBe(1);
    expect(parentSummary.body.data.counts.pl.total).toBe(1);
    const childCard = (parentSummary.body.data.children as Array<{ id: string; counts: { act?: { total?: number } } }>).find(
      (row) => row.id === childId
    );
    expect(childCard?.counts.act?.total).toBe(1);

    const catalog = await request(app).get(`/api/geo/${parentId}/activities`);
    expect(catalog.status).toBe(200);
    expect(
      (catalog.body.data.items as Array<{ _id?: string; title?: string }>).some(
        (row) => row._id === `act-${suffix}` || row.title?.includes(suffix)
      )
    ).toBe(true);
  });
});
