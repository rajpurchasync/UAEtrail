import {
  ActivityType,
  Difficulty,
  ActivityStatus,
  LocationStatus,
  MembershipRole,
  RequestStatus,
  TenantStatus,
  TenantType,
  UserRole,
  UserStatus
} from '../../src/domain/enums.js';
import bcrypt from 'bcryptjs';
import { createAuthUser } from '../../src/lib/auth-users.js';
import { newEntityId } from '../../src/lib/entity-builders.js';
import { createActivityDetailed, createLocationRecord } from '../../src/lib/activities-store.js';
import { getMongoClient } from '../../src/lib/mongo.js';
import { generateReferralCode } from '../../src/lib/referral-code.js';
import { createTenantRecord } from '../../src/lib/tenant-store.js';
import { upsertTenantMembership } from '../../src/lib/tenant-access.js';

export interface PublishedEventFixture {
  organizerId: string;
  tenantId: string;
  locationId: string;
  activityId: string;
}

const db = () => getMongoClient()!.db();

export const createPublishedEventFixture = async (suffix: string): Promise<PublishedEventFixture> => {
  const passwordHash = await bcrypt.hash('TestPass1', 10);
  const organizer = await createAuthUser({
    email: `org-${suffix}@test.local`,
    passwordHash,
    googleId: null,
    authProvider: 'EMAIL',
    role: UserRole.TENANT_OWNER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    referralCode: generateReferralCode(),
    profile: { displayName: 'Test Organizer', phone: null, bio: null, avatarUrl: null }
  });

  const tenant = await createTenantRecord({
    name: `Test Org ${suffix}`,
    slug: `test-org-${suffix}`,
    type: TenantType.GUIDE_OWNED,
    status: TenantStatus.ACTIVE,
    ownerId: organizer._id
  });

  await upsertTenantMembership({
    tenantId: tenant.id,
    userId: organizer._id,
    role: MembershipRole.TENANT_OWNER
  });

  const location = await createLocationRecord({
    name: `Test Trail ${suffix}`,
    region: 'Dubai',
    activityType: ActivityType.HIKING,
    description: 'Integration test location',
    difficulty: Difficulty.EASY,
    season: ['winter'],
    images: ['https://example.com/img.jpg'],
    highlights: [],
    surfaceType: [],
    tags: [],
    accessibleBy: [],
    status: LocationStatus.ACTIVE
  });

  const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const event = await createActivityDetailed({
    tenant: { connect: { id: tenant.id } },
    location: { connect: { id: location.id } },
    createdBy: { connect: { id: organizer._id } },
    title: `Test Trip ${suffix}`,
    description: 'Join us for a test hike',
    startAt,
    endAt: new Date(startAt.getTime() + 4 * 60 * 60 * 1000),
    images: [],
    itinerary: [],
    requirements: [],
    capacity: 5,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    priceAed: 0
  });

  return {
    organizerId: organizer._id,
    tenantId: tenant.id,
    locationId: location.id,
    activityId: event.id
  };
};

export const createFullEventFixture = async (suffix: string): Promise<PublishedEventFixture> => {
  const fixture = await createPublishedEventFixture(`${suffix}-full`);

  await db().collection('activities').updateOne({ _id: fixture.activityId }, { $set: { capacity: 1 } });

  const filler = await createAuthUser({
    email: `filler-${suffix}@test.local`,
    passwordHash: await bcrypt.hash('TestPass1', 10),
    googleId: null,
    authProvider: 'EMAIL',
    role: UserRole.PARTICIPANT,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    referralCode: generateReferralCode(),
    profile: { displayName: 'Capacity Filler', phone: null, bio: null, avatarUrl: null }
  });

  const requestId = newEntityId();
  const now = new Date();
  await db().collection('activity_requests').insertOne({
    _id: requestId,
    activityId: fixture.activityId,
    userId: filler._id,
    status: RequestStatus.APPROVED,
    createdAt: now,
    updatedAt: now
  });

  await db().collection('activity_participants').insertOne({
    _id: newEntityId(),
    activityId: fixture.activityId,
    userId: filler._id,
    requestId,
    approvedById: fixture.organizerId,
    createdAt: now
  });

  return fixture;
};

export const cleanupEventFixture = async (fixture: PublishedEventFixture): Promise<void> => {
  await db().collection('activity_participants').deleteMany({ activityId: fixture.activityId });
  await db().collection('activity_requests').deleteMany({ activityId: fixture.activityId });
  await db().collection('activities').deleteMany({ _id: fixture.activityId });
  await db().collection('locations').deleteMany({ _id: fixture.locationId });
  await db().collection('tenant_memberships').deleteMany({ tenantId: fixture.tenantId });
  await db().collection('tenants').deleteMany({ _id: fixture.tenantId });
  await db().collection('auth_users').deleteMany({ _id: fixture.organizerId });
};

export const cleanupTestUsers = async (): Promise<void> => {
  const testUsers = await db()
    .collection('auth_users')
    .find({ email: { $regex: /@test\.local$/ } }, { projection: { _id: 1 } })
    .toArray();
  const testUserIds = testUsers.map((user) => user._id as string);
  if (testUserIds.length === 0) return;

  const testTenants = await db()
    .collection('tenants')
    .find({ ownerId: { $in: testUserIds } }, { projection: { _id: 1 } })
    .toArray();
  const testTenantIds = testTenants.map((tenant) => tenant._id as string);

  if (testTenantIds.length > 0) {
    const testEvents = await db()
      .collection('activities')
      .find({ tenantId: { $in: testTenantIds } }, { projection: { _id: 1, locationId: 1 } })
      .toArray();
    const testEventIds = testEvents.map((event) => event._id as string);
    const testLocationIds = [...new Set(testEvents.map((event) => event.locationId as string))];

    if (testEventIds.length > 0) {
      await db().collection('activity_participants').deleteMany({ activityId: { $in: testEventIds } });
      await db().collection('activity_requests').deleteMany({ activityId: { $in: testEventIds } });
      await db().collection('activities').deleteMany({ _id: { $in: testEventIds } });
    }

    if (testLocationIds.length > 0) {
      await db().collection('locations').deleteMany({ _id: { $in: testLocationIds } });
    }

    await db().collection('tenant_memberships').deleteMany({ tenantId: { $in: testTenantIds } });
    await db().collection('tenants').deleteMany({ _id: { $in: testTenantIds } });
  }

  await db().collection('activity_requests').deleteMany({ userId: { $in: testUserIds } });
  await db().collection('refresh_tokens').deleteMany({ userId: { $in: testUserIds } });
  await db().collection('email_verification_tokens').deleteMany({ userId: { $in: testUserIds } });
  await db().collection('auth_users').deleteMany({ _id: { $in: testUserIds } });
};

import { peekTestVerificationOtp } from '../../src/lib/email.js';

export const getVerificationOtp = (email: string): string => {
  const otp = peekTestVerificationOtp(email);
  if (!otp) {
    throw new Error(`No verification OTP captured for ${email}`);
  }
  return otp;
};

export const registerVerifiedVisitor = async (
  app: import('express').Express,
  suffix: string
): Promise<{ email: string; password: string; accessToken: string }> => {
  const request = (await import('supertest')).default;
  const email = `visitor-${suffix}@test.local`;
  const password = 'TestPass1';

  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email,
      password,
      displayName: 'Join Test Visitor',
      accountType: 'participant'
    });

  if (registerRes.status !== 201) {
    throw new Error(`Failed to register test visitor: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }

  const verifyRes = await request(app)
    .post('/api/v1/auth/verify-email')
    .send({ email, otp: getVerificationOtp(email) });

  if (verifyRes.status !== 200) {
    throw new Error(`Failed to verify test visitor: ${verifyRes.status}`);
  }

  return {
    email,
    password,
    accessToken: verifyRes.body.tokens.accessToken as string
  };
};
