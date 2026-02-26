import bcrypt from 'bcryptjs';
import {
  Accessibility,
  ActivityType,
  Difficulty,
  EventStatus,
  MembershipRole,
  PrismaClient,
  RequestStatus,
  TenantStatus,
  TenantType,
  UserRole,
  UserStatus
} from '@prisma/client';

const prisma = new PrismaClient();

const credentials = {
  admin: 'Admin@12345',
  organizer: 'Organizer@12345',
  guide: 'Guide@12345',
  visitor: 'Visitor@12345',
  pendingVisitor: 'Visitor2@12345'
};

const upsertUser = async ({
  email,
  password,
  role,
  displayName
}: {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
}) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    },
    create: {
      email,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    }
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { displayName },
    create: {
      userId: user.id,
      displayName
    }
  });

  return user;
};

async function main() {
  const admin = await upsertUser({
    email: 'admin@uaetrails.app',
    password: credentials.admin,
    role: UserRole.PLATFORM_ADMIN,
    displayName: 'UAE Trails Admin'
  });

  const organizer = await upsertUser({
    email: 'organizer@uaetrails.app',
    password: credentials.organizer,
    role: UserRole.TENANT_OWNER,
    displayName: 'Adventure Organizer'
  });

  const guide = await upsertUser({
    email: 'guide@uaetrails.app',
    password: credentials.guide,
    role: UserRole.TENANT_GUIDE,
    displayName: 'Trail Guide'
  });

  const visitor = await upsertUser({
    email: 'visitor@uaetrails.app',
    password: credentials.visitor,
    role: UserRole.VISITOR,
    displayName: 'Visitor User'
  });

  const pendingVisitor = await upsertUser({
    email: 'visitor2@uaetrails.app',
    password: credentials.pendingVisitor,
    role: UserRole.VISITOR,
    displayName: 'Pending Visitor'
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'uae-adventure-co' },
    update: {
      name: 'UAE Adventure Co',
      type: TenantType.COMPANY,
      status: TenantStatus.ACTIVE,
      ownerId: organizer.id
    },
    create: {
      id: 'tenant-uae-adventure',
      name: 'UAE Adventure Co',
      slug: 'uae-adventure-co',
      type: TenantType.COMPANY,
      status: TenantStatus.ACTIVE,
      ownerId: organizer.id
    }
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: organizer.id
      }
    },
    update: {
      role: MembershipRole.TENANT_OWNER
    },
    create: {
      tenantId: tenant.id,
      userId: organizer.id,
      role: MembershipRole.TENANT_OWNER
    }
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: guide.id
      }
    },
    update: {
      role: MembershipRole.TENANT_GUIDE
    },
    create: {
      tenantId: tenant.id,
      userId: guide.id,
      role: MembershipRole.TENANT_GUIDE
    }
  });

  const seedLocations = [
    {
      id: 'jebel-jais-summit-trail',
      name: 'Jebel Jais Summit Trail',
      region: 'RAK',
      activityType: ActivityType.HIKING,
      difficulty: Difficulty.HARD,
      description: 'A demanding mountain route with panoramic views.',
      season: ['winter', 'year-round'],
      childFriendly: false,
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
      featured: true
    },
    {
      id: 'wadi-shawka-loop',
      name: 'Wadi Shawka Loop',
      region: 'RAK',
      activityType: ActivityType.HIKING,
      difficulty: Difficulty.MODERATE,
      description: 'Scenic wadi route suitable for groups.',
      season: ['winter', 'year-round'],
      childFriendly: true,
      images: ['https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800'],
      featured: true
    },
    {
      id: 'fossil-rock-desert-camp',
      name: 'Fossil Rock Desert Camp',
      region: 'Sharjah',
      activityType: ActivityType.CAMPING,
      description: 'Popular desert camping location for group overnights.',
      season: ['winter'],
      childFriendly: true,
      maxGroupSize: 20,
      accessibility: Accessibility.REMOTE,
      images: ['https://images.unsplash.com/photo-1520904549193-5ab44c10b0d8?w=800'],
      featured: true
    }
  ];

  for (const location of seedLocations) {
    await prisma.location.upsert({
      where: { id: location.id },
      update: location,
      create: location
    });
  }

  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(6, 0, 0, 0);

  const event = await prisma.event.upsert({
    where: { id: 'seed-event-jais' },
    update: {
      tenantId: tenant.id,
      locationId: 'jebel-jais-summit-trail',
      createdById: organizer.id,
      guideId: guide.id,
      title: 'Jebel Jais Group Hike',
      description: 'Guided early morning summit trek.',
      startAt: start,
      priceAed: 120,
      capacity: 15,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    },
    create: {
      id: 'seed-event-jais',
      tenantId: tenant.id,
      locationId: 'jebel-jais-summit-trail',
      createdById: organizer.id,
      guideId: guide.id,
      title: 'Jebel Jais Group Hike',
      description: 'Guided early morning summit trek.',
      startAt: start,
      meetingPoint: 'Jebel Jais Base Parking',
      itinerary: ['Meet at 6:00 AM', 'Summit climb', 'Return by noon'],
      requirements: ['Water 2L', 'Hiking shoes', 'Cap and sunscreen'],
      priceAed: 120,
      capacity: 15,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });

  const approvedRequest = await prisma.eventRequest.upsert({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: visitor.id
      }
    },
    update: {
      status: RequestStatus.APPROVED,
      reviewedById: organizer.id,
      reviewedAt: new Date(),
      organizerNote: 'Approved, see you on the trail.'
    },
    create: {
      eventId: event.id,
      userId: visitor.id,
      status: RequestStatus.APPROVED,
      reviewedById: organizer.id,
      reviewedAt: new Date(),
      organizerNote: 'Approved, see you on the trail.'
    }
  });

  await prisma.eventParticipant.upsert({
    where: { requestId: approvedRequest.id },
    update: {
      eventId: event.id,
      userId: visitor.id,
      approvedById: organizer.id
    },
    create: {
      eventId: event.id,
      userId: visitor.id,
      requestId: approvedRequest.id,
      approvedById: organizer.id
    }
  });

  await prisma.eventRequest.upsert({
    where: {
      eventId_userId: {
        eventId: event.id,
        userId: pendingVisitor.id
      }
    },
    update: {
      status: RequestStatus.PENDING,
      note: 'Can I join this weekend?'
    },
    create: {
      eventId: event.id,
      userId: pendingVisitor.id,
      status: RequestStatus.PENDING,
      note: 'Can I join this weekend?'
    }
  });

  console.log('Seed complete.');
  console.log(`Admin: admin@uaetrails.app / ${credentials.admin}`);
  console.log(`Organizer: organizer@uaetrails.app / ${credentials.organizer}`);
  console.log(`Guide: guide@uaetrails.app / ${credentials.guide}`);
  console.log(`Visitor: visitor@uaetrails.app / ${credentials.visitor}`);
  console.log(`Pending Visitor: visitor2@uaetrails.app / ${credentials.pendingVisitor}`);
  console.log(`Organizer tenant id: ${tenant.id}`);
  console.log(`Seeded by admin id: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
