import {
  ActivityType,
  Difficulty,
  EventStatus,
  LocationStatus,
  MembershipRole,
  RequestStatus,
  TenantStatus,
  TenantType,
  UserRole,
  UserStatus
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from '../../src/lib/referral-code.js';
import { prisma } from '../../src/lib/prisma.js';

export interface PublishedEventFixture {
  organizerId: string;
  tenantId: string;
  locationId: string;
  eventId: string;
}

export const createPublishedEventFixture = async (suffix: string): Promise<PublishedEventFixture> => {
  const passwordHash = await bcrypt.hash('TestPass1', 10);
  const organizer = await prisma.user.create({
    data: {
      email: `org-${suffix}@test.local`,
      passwordHash,
      role: UserRole.TENANT_OWNER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { create: { displayName: 'Test Organizer' } }
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: `Test Org ${suffix}`,
      slug: `test-org-${suffix}`,
      type: TenantType.GUIDE_OWNED,
      status: TenantStatus.ACTIVE,
      ownerId: organizer.id,
      memberships: {
        create: {
          userId: organizer.id,
          role: MembershipRole.TENANT_OWNER
        }
      }
    }
  });

  const location = await prisma.location.create({
    data: {
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
    }
  });

  const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const event = await prisma.event.create({
    data: {
      tenantId: tenant.id,
      locationId: location.id,
      createdById: organizer.id,
      title: `Test Trip ${suffix}`,
      description: 'Join us for a test hike',
      startAt,
      endAt: new Date(startAt.getTime() + 4 * 60 * 60 * 1000),
      images: [],
      itinerary: [],
      requirements: [],
      capacity: 5,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      priceAed: 0
    }
  });

  return {
    organizerId: organizer.id,
    tenantId: tenant.id,
    locationId: location.id,
    eventId: event.id
  };
};

export const createFullEventFixture = async (suffix: string): Promise<PublishedEventFixture> => {
  const fixture = await createPublishedEventFixture(`${suffix}-full`);
  await prisma.event.update({
    where: { id: fixture.eventId },
    data: { capacity: 1 }
  });

  const filler = await prisma.user.create({
    data: {
      email: `filler-${suffix}@test.local`,
      passwordHash: await bcrypt.hash('TestPass1', 10),
      role: UserRole.VISITOR,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      referralCode: generateReferralCode(),
      profile: { create: { displayName: 'Capacity Filler' } }
    }
  });

  const request = await prisma.eventRequest.create({
    data: {
      eventId: fixture.eventId,
      userId: filler.id,
      status: RequestStatus.APPROVED
    }
  });

  await prisma.eventParticipant.create({
    data: {
      eventId: fixture.eventId,
      userId: filler.id,
      requestId: request.id,
      approvedById: fixture.organizerId
    }
  });

  return fixture;
};

export const cleanupEventFixture = async (fixture: PublishedEventFixture): Promise<void> => {
  await prisma.eventParticipant.deleteMany({ where: { eventId: fixture.eventId } });
  await prisma.eventRequest.deleteMany({ where: { eventId: fixture.eventId } });
  await prisma.event.deleteMany({ where: { id: fixture.eventId } });
  await prisma.location.deleteMany({ where: { id: fixture.locationId } });
  await prisma.tenantMembership.deleteMany({ where: { tenantId: fixture.tenantId } });
  await prisma.tenant.deleteMany({ where: { id: fixture.tenantId } });
  await prisma.user.deleteMany({ where: { id: fixture.organizerId } });
};

export const cleanupTestUsers = async (): Promise<void> => {
  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@test.local' } },
    select: { id: true }
  });
  const testUserIds = testUsers.map((user) => user.id);
  if (testUserIds.length === 0) return;

  const testTenants = await prisma.tenant.findMany({
    where: { ownerId: { in: testUserIds } },
    select: { id: true }
  });
  const testTenantIds = testTenants.map((tenant) => tenant.id);

  if (testTenantIds.length > 0) {
    const testEvents = await prisma.event.findMany({
      where: { tenantId: { in: testTenantIds } },
      select: { id: true, locationId: true }
    });
    const testEventIds = testEvents.map((event) => event.id);
    const testLocationIds = [...new Set(testEvents.map((event) => event.locationId))];

    if (testEventIds.length > 0) {
      await prisma.eventParticipant.deleteMany({ where: { eventId: { in: testEventIds } } });
      await prisma.eventRequest.deleteMany({ where: { eventId: { in: testEventIds } } });
      await prisma.event.deleteMany({ where: { id: { in: testEventIds } } });
    }

    if (testLocationIds.length > 0) {
      await prisma.location.deleteMany({ where: { id: { in: testLocationIds } } });
    }

    await prisma.tenantMembership.deleteMany({ where: { tenantId: { in: testTenantIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: testTenantIds } } });
  }

  await prisma.eventRequest.deleteMany({ where: { userId: { in: testUserIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: testUserIds } } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: testUserIds } } });
  await prisma.profile.deleteMany({ where: { userId: { in: testUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
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
      accountType: 'visitor'
    });

  if (registerRes.status !== 201) {
    throw new Error(`Failed to register test visitor: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }

  const verifyRes = await request(app)
    .post('/api/v1/auth/verify-email')
    .send({ token: registerRes.body.verificationToken });

  if (verifyRes.status !== 200) {
    throw new Error(`Failed to verify test visitor: ${verifyRes.status}`);
  }

  return {
    email,
    password,
    accessToken: registerRes.body.tokens.accessToken as string
  };
};
