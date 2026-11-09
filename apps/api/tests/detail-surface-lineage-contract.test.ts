/**
 * DOMAIN_CANONICALS §3.2 — write registry → public detail read (catalog, member, host, shop).
 * @see docs/DOMAIN_CANONICALS.md §3 · detailSurfaceDataLineageGuard
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import {
  ActivityStatus,
  LocationStatus,
  MembershipRole,
  TenantBusinessMode,
  TenantStatus,
  TenantType,
} from '../src/domain/enums.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { createMerchantProfileForUser } from '../src/lib/shop-store.js';
import { createTenantRecord, findTenantById } from '../src/lib/tenant-store.js';
import { findAuthUserByEmail } from '../src/lib/auth-users-store.js';
import { upsertTenantMembership } from '../src/lib/tenant-access.js';
import { bootstrapTestApp } from './helpers/bootstrap.js';
import {
  cleanupEventFixture,
  cleanupTestUsers,
  createPublishedEventFixture,
  registerVerifiedPlatformAdmin,
  registerVerifiedVisitor,
  type PublishedEventFixture,
} from './helpers/fixtures.js';
import { defaultTestAreaId, ensureCuratedAreasSeeded } from './helpers/test-seed.js';
import { createFacilityRecord } from '../src/lib/facilities-store.js';

let app: Express;
const suffix = `detail-lineage-${Date.now()}`;
let adminToken = '';
let createdAreaId: string | null = null;
let createdPlaceId: string | null = null;
const areaSlug = `lineage-area-${suffix}`;
let hostFixture: PublishedEventFixture | null = null;
let httpPublishedActivityId: string | null = null;
const hostFixtureSuffix = `${suffix}-host`;
let shopMerchantId: string | null = null;

const adminAuth = () => ({ Authorization: `Bearer ${adminToken}` });

const placeCreateBody = (areaId: string, name: string) => ({
  name,
  region: 'Dubai',
  areaId,
  activityType: 'hiking',
  description: 'Admin catalog trail for detail surface lineage contract test run.',
  season: ['year-round'],
  status: 'active',
  images: ['https://example.com/trail-lineage.jpg'],
});

beforeAll(async () => {
  app = await bootstrapTestApp();
  await ensureCuratedAreasSeeded();
  const admin = await registerVerifiedPlatformAdmin(app, suffix);
  adminToken = admin.accessToken;
  hostFixture = await createPublishedEventFixture(hostFixtureSuffix);

  const shopOwner = await registerVerifiedVisitor(app, `${suffix}-shop`);
  const ownerUser = await findAuthUserByEmail(shopOwner.email);
  if (!ownerUser) throw new Error('shop owner missing');
  const shopTenant = await createTenantRecord({
    name: `Lineage Shop ${suffix}`,
    slug: `lineage-shop-${suffix}`,
    type: TenantType.COMPANY,
    status: TenantStatus.ACTIVE,
    ownerId: ownerUser._id,
  });
  await getMongoClient()!
    .db()
    .collection('tenants')
    .updateOne(
      { _id: shopTenant.id },
      { $set: { businessMode: TenantBusinessMode.SHOP, status: TenantStatus.ACTIVE } }
    );
  await upsertTenantMembership({
    tenantId: shopTenant.id,
    userId: ownerUser._id,
    role: MembershipRole.TENANT_OWNER,
  });
  const merchant = await createMerchantProfileForUser(
    ownerUser._id,
    {
      shopName: `Lineage Gear ${suffix}`,
      description: 'Detail surface lineage shop contract.',
      region: 'Dubai',
      latitude: 25.2,
      longitude: 55.27,
    },
    { tenantId: shopTenant.id, linkShopTenant: true }
  );
  shopMerchantId = merchant.id;
});

afterAll(async () => {
  const db = getMongoClient()!.db();
  if (shopMerchantId) {
    await db.collection('merchant_profiles').deleteMany({ _id: shopMerchantId });
  }
  if (httpPublishedActivityId) {
    await db.collection('activity_participants').deleteMany({ activityId: httpPublishedActivityId });
    await db.collection('activity_requests').deleteMany({ activityId: httpPublishedActivityId });
    await db.collection('activities').deleteMany({ _id: httpPublishedActivityId });
  }
  if (hostFixture) {
    await cleanupEventFixture(hostFixture);
  }
  if (createdPlaceId) {
    await request(app).delete(`/api/admin/places/${createdPlaceId}`).set(adminAuth());
  }
  if (createdAreaId) {
    await request(app).delete(`/api/admin/areas/${createdAreaId}`).set(adminAuth());
  }
  await cleanupTestUsers();
});

describe('detail surface lineage (admin catalog → public read)', () => {
  it('draft area is hidden from public detail; publish exposes GET /areas/:slug', async () => {
    const create = await request(app)
      .post('/api/admin/areas')
      .set(adminAuth())
      .send({
        slug: areaSlug,
        name: `Lineage Area ${suffix}`,
        region: 'Dubai',
        status: 'draft',
        center: { latitude: 24.82, longitude: 56.12 },
        summary: 'Integration test curated area for lineage contract.',
      });

    expect(create.status).toBe(201);
    createdAreaId = create.body.data.id as string;

    const draftPublic = await request(app).get(`/api/areas/${areaSlug}`);
    expect(draftPublic.status).toBe(404);

    const publish = await request(app)
      .patch(`/api/admin/areas/${createdAreaId}`)
      .set(adminAuth())
      .send({ status: 'published' });

    expect(publish.status).toBe(200);
    expect(publish.body.data.status).toBe('published');

    const publicDetail = await request(app).get(`/api/areas/${areaSlug}`);
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.data.area.slug).toBe(areaSlug);
    expect(publicDetail.body.data.preview).toMatchObject({
      activities: expect.any(Array),
      places: expect.any(Array),
    });
  });

  it('admin place with areaId is readable on GET /places/:id and listed in area preview', async () => {
    expect(createdAreaId).toBeTruthy();
    const placeName = `Lineage Trail ${suffix}`;
    const create = await request(app)
      .post('/api/admin/places')
      .set(adminAuth())
      .send(placeCreateBody(createdAreaId!, placeName));

    expect(create.status).toBe(201);
    createdPlaceId = create.body.data.id as string;
    expect(create.body.data.areaId).toBe(createdAreaId);

    const publicPlace = await request(app).get(`/api/places/${createdPlaceId}`);
    expect(publicPlace.status).toBe(200);
    expect(publicPlace.body.data.id).toBe(createdPlaceId);
    expect(publicPlace.body.data.name).toBe(placeName);
    expect(publicPlace.body.data.areaId).toBe(createdAreaId);

    const areaDetail = await request(app).get(`/api/areas/${areaSlug}`);
    expect(areaDetail.status).toBe(200);
    const previewIds = (areaDetail.body.data.preview.places as Array<{ id: string }>).map((p) => p.id);
    expect(previewIds).toContain(createdPlaceId);

    const facility = await createFacilityRecord({
      name: `Lineage toilet ${suffix}`,
      region: 'Dubai',
      areaId: createdAreaId!,
      facilityKind: 'toilet',
      parentPlaceId: createdPlaceId!,
      description: 'Facility amenity for detail surface lineage public GET contract.',
      latitude: 25.2,
      longitude: 55.27,
      images: ['https://example.com/lineage-facility.jpg'],
      registeredByUserId: 'lineage-admin',
      status: LocationStatus.ACTIVE,
    });

    const facilityRead = await request(app).get(`/api/facilities/${facility.id}`);
    expect(facilityRead.status).toBe(200);
    expect(facilityRead.body.viewerAccess?.canOpenDetailPage).toBe(true);
  });
});

describe('detail surface lineage (member profile write → public read)', () => {
  it('PATCH /me/profile is visible on GET /member/:id/profile', async () => {
    const member = await registerVerifiedVisitor(app, `${suffix}-member`);

    const patch = await request(app)
      .patch('/api/me/profile')
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({
        givenName: 'Lineage',
        surname: 'Member',
        bio: 'Detail lineage member profile integration test.',
        profileVisibility: 'public',
      });

    expect(patch.status).toBe(200);
    const displayName = patch.body.data.displayName as string;
    expect(displayName).toBe('Lineage Member');

    const me = await request(app)
      .get('/api/me/profile')
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(me.status).toBe(200);
    const userId = me.body.data.id as string;

    const viewer = await registerVerifiedVisitor(app, `${suffix}-viewer`);
    const publicProfile = await request(app)
      .get(`/api/member/${userId}/profile`)
      .set('Authorization', `Bearer ${viewer.accessToken}`);
    expect(publicProfile.status).toBe(200);
    expect(publicProfile.body.data.visibilityState).toBe('full');
    expect(publicProfile.body.data.displayName).toBe(displayName);
  });

  it('seeded catalog place remains readable (baseline for place detail facade)', async () => {
    const location = await request(app)
      .post('/api/admin/places')
      .set(adminAuth())
      .send(placeCreateBody(defaultTestAreaId(), `Baseline Trail ${suffix}`));

    expect(location.status).toBe(201);
    const id = location.body.data.id as string;

    const read = await request(app).get(`/api/places/${id}`);
    expect(read.status).toBe(200);

    await request(app).delete(`/api/admin/places/${id}`).set(adminAuth());
  });
});

describe('detail surface lineage (host publish → activity detail)', () => {
  it('published activity is readable on GET /activities/:id with presentation + viewerAccess', async () => {
    expect(hostFixture).toBeTruthy();
    const guest = await request(app).get(`/api/activities/${hostFixture!.activityId}`);
    expect(guest.status).toBe(200);
    expect(guest.body.data.id).toBe(hostFixture!.activityId);
    expect(guest.body.viewerAccess).toMatchObject({
      exposure: 'none',
      gateReason: 'sign_in',
    });
    expect(guest.body.presentation).toBeNull();

    const visitor = await registerVerifiedVisitor(app, `${suffix}-detail-read`);
    const res = await request(app)
      .get(`/api/activities/${hostFixture!.activityId}`)
      .set('Authorization', `Bearer ${visitor.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(hostFixture!.activityId);
    expect(res.body.data.title).toMatch(/Test Activity/);
    expect(res.body.viewerAccess).toMatchObject({
      exposure: expect.stringMatching(/^(full|redacted)$/),
    });
    expect(res.body.presentation).toBeTruthy();
    expect(res.body.presentation.sections).toMatchObject({
      showHostProfile: true,
      participants: expect.stringMatching(/^(hidden|preview|roster)$/),
      showMeetingPoint: expect.any(Boolean),
      canOpenParticipantRoster: expect.any(Boolean),
    });
    expect(res.body.presentation.footerByTab).toBeTruthy();
    expect(res.body.presentation.tabs).toBeUndefined();
  });

  it('POST /publishing/activities + publish exposes GET /activities/:id', async () => {
    expect(hostFixture).toBeTruthy();
    const hostEmail = `org-${hostFixtureSuffix}@test.local`;
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: hostEmail, password: 'TestPass1' });
    expect(login.status).toBe(200);
    const hostToken = login.body.tokens.accessToken as string;

    const signup = await request(app)
      .patch('/api/me/profile/signup-details')
      .set('Authorization', `Bearer ${hostToken}`)
      .send({
        dateOfBirth: '1990-01-15',
        gender: 'prefer_not_to_say',
        countryCode: 'AE',
        languages: 'en',
      });
    expect(signup.status).toBe(200);

    const create = await request(app)
      .post('/api/publishing/activities')
      .set('Authorization', `Bearer ${hostToken}`)
      .set('x-organisation-id', hostFixture!.tenantId)
      .send({
        activityType: 'hiking',
        locationId: hostFixture!.locationId,
        title: 'Lineage HTTP publish hike',
        description: 'Host console draft and publish for detail surface lineage contract.',
        date: '2026-12-21',
        time: '07:30',
        capacity: 8,
        price: 0,
        requirements: ['Instructions: Follow the host and bring enough water for the hike.'],
      });

    expect(create.status).toBe(201);
    httpPublishedActivityId = create.body.data.id as string;

    const publish = await request(app)
      .post(`/api/publishing/activities/${httpPublishedActivityId}/publish`)
      .set('Authorization', `Bearer ${hostToken}`)
      .set('x-organisation-id', hostFixture!.tenantId);

    expect(publish.status).toBe(200);

    const visitor = await registerVerifiedVisitor(app, `${suffix}-http-publish-read`);
    const publicDetail = await request(app)
      .get(`/api/activities/${httpPublishedActivityId}`)
      .set('Authorization', `Bearer ${visitor.accessToken}`);
    expect(publicDetail.status).toBe(200);
    expect(publicDetail.body.data.title).toBe('Lineage HTTP publish hike');
    expect(publicDetail.body.presentation).toBeTruthy();
  });

  it('unpublished activity is hidden from public detail', async () => {
    expect(hostFixture).toBeTruthy();
    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne({ _id: hostFixture!.activityId }, { $set: { status: ActivityStatus.DRAFT } });

    const hidden = await request(app).get(`/api/activities/${hostFixture!.activityId}`);
    expect(hidden.status).toBe(404);

    await getMongoClient()!
      .db()
      .collection('activities')
      .updateOne(
        { _id: hostFixture!.activityId },
        { $set: { status: ActivityStatus.PUBLISHED, publishedAt: new Date() } }
      );
  });
});

describe('detail surface lineage (pro tenant → organisation public)', () => {
  it('guide tenant slug resolves on GET /tenants/:slug with activities bundle', async () => {
    expect(hostFixture).toBeTruthy();
    const tenant = await findTenantById(hostFixture!.tenantId);
    expect(tenant?.slug).toBeTruthy();

    const res = await request(app).get(`/api/tenants/${tenant!.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(tenant!.slug);
    expect(res.body.data.activities).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: hostFixture!.activityId })])
    );
  });
});

describe('detail surface lineage (shop merchant → public shop)', () => {
  it('merchant profile is readable on GET /shops/:id', async () => {
    expect(shopMerchantId).toBeTruthy();
    const res = await request(app).get(`/api/shop/shops/${shopMerchantId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.shopName).toMatch(/Lineage Gear/);
    expect(res.body.data.products).toBeUndefined();
  });
});
