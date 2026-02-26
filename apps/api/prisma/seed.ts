import bcrypt from 'bcryptjs';
import {
  Accessibility,
  ActivityType,
  Difficulty,
  EventStatus,
  MembershipRole,
  NotificationType,
  PrismaClient,
  ProductStatus,
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
      description: 'A demanding mountain route with panoramic views of the Hajar Mountains. The trail traverses rugged terrain with steep ascents and descents, rewarding hikers with breathtaking vistas from the highest peak in the UAE.',
      season: ['winter', 'year-round'],
      childFriendly: false,
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
      featured: true,
      distance: 12.5,
      duration: 6,
      elevation: 1934,
      latitude: 25.9545,
      longitude: 56.2730,
      highlights: ['Summit views', 'Rock formations', 'Wildlife spotting', 'Via Ferrata option']
    },
    {
      id: 'wadi-shawka-loop',
      name: 'Wadi Shawka Loop',
      region: 'RAK',
      activityType: ActivityType.HIKING,
      difficulty: Difficulty.MODERATE,
      description: 'Scenic wadi route suitable for groups with beautiful pools and rock formations. The trail follows the seasonal riverbed through dramatic canyon walls.',
      season: ['winter', 'year-round'],
      childFriendly: true,
      images: ['https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800'],
      featured: true,
      distance: 8,
      duration: 4,
      elevation: 450,
      latitude: 25.3400,
      longitude: 56.1200,
      highlights: ['Natural pools', 'Canyon views', 'Family friendly', 'Dam viewpoint']
    },
    {
      id: 'fossil-rock-desert-camp',
      name: 'Fossil Rock Desert Camp',
      region: 'Sharjah',
      activityType: ActivityType.CAMPING,
      description: 'Popular desert camping location for group overnights near the iconic Fossil Rock formation. Perfect for stargazing and exploring the surrounding desert landscape.',
      season: ['winter'],
      childFriendly: true,
      maxGroupSize: 20,
      accessibility: Accessibility.REMOTE,
      images: ['https://images.unsplash.com/photo-1520904549193-5ab44c10b0d8?w=800'],
      featured: true,
      campingType: 'operator-led',
      latitude: 25.2200,
      longitude: 55.8500,
      highlights: ['Stargazing', 'Fossil hunting', 'Desert sunrise', 'BBQ area']
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

  // ─── Merchant & Products ──────────────────────────────────────────────────

  const merchantProfile = await prisma.merchantProfile.upsert({
    where: { userId: visitor.id },
    update: {
      shopName: 'Desert Gear Co',
      description: 'Quality hiking and camping gear for UAE adventures.',
      contactEmail: 'shop@desertgear.ae',
      contactPhone: '+971-50-1234567'
    },
    create: {
      userId: visitor.id,
      shopName: 'Desert Gear Co',
      description: 'Quality hiking and camping gear for UAE adventures.',
      contactEmail: 'shop@desertgear.ae',
      contactPhone: '+971-50-1234567'
    }
  });

  const seedProducts = [
    {
      name: 'Trail Running Shoes',
      description: 'Lightweight trail shoes with excellent grip for rocky terrain.',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
      priceAed: 450,
      discountPercent: 10,
      category: 'footwear',
      status: ProductStatus.ACTIVE
    },
    {
      name: 'Ultralight Tent 2P',
      description: 'Two-person tent weighing only 1.5kg, perfect for desert camping.',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'],
      priceAed: 890,
      category: 'shelter',
      status: ProductStatus.ACTIVE
    },
    {
      name: 'Hydration Pack 3L',
      description: 'Hands-free hydration system with 3-liter reservoir.',
      images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800'],
      priceAed: 280,
      discountPercent: 15,
      packagingInfo: 'Ships in eco-friendly packaging',
      category: 'accessories',
      status: ProductStatus.ACTIVE
    },
    {
      name: 'Trekking Poles (Pair)',
      description: 'Carbon fiber trekking poles, adjustable 65-135cm.',
      images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'],
      priceAed: 320,
      category: 'gear',
      status: ProductStatus.ACTIVE
    },
    {
      name: 'Headlamp Pro 800lm',
      description: 'Rechargeable headlamp with 800 lumens, red light mode.',
      images: ['https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800'],
      priceAed: 180,
      category: 'gear',
      status: ProductStatus.DRAFT
    }
  ];

  for (const product of seedProducts) {
    await prisma.product.upsert({
      where: { id: `seed-product-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` },
      update: { ...product, merchantId: merchantProfile.id },
      create: {
        id: `seed-product-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        merchantId: merchantProfile.id,
        ...product
      }
    });
  }

  // ─── Chat Messages ────────────────────────────────────────────────────────

  const chatMessages = [
    {
      senderId: visitor.id,
      receiverId: organizer.id,
      content: 'Hi! I signed up for the Jebel Jais hike. What should I bring?',
      eventId: event.id
    },
    {
      senderId: organizer.id,
      receiverId: visitor.id,
      content: 'Great to have you! Bring at least 2L of water, hiking shoes, and sun protection. We start early!',
      eventId: event.id
    },
    {
      senderId: visitor.id,
      receiverId: organizer.id,
      content: 'Perfect, thanks! Should I bring my own headlamp?',
      eventId: event.id
    },
    {
      senderId: organizer.id,
      receiverId: visitor.id,
      content: 'Yes, a headlamp is recommended since we start before sunrise. See you there!',
      eventId: event.id
    }
  ];

  // Delete existing chat messages for idempotent re-seeding
  await prisma.chatMessage.deleteMany({
    where: {
      OR: [
        { senderId: visitor.id, receiverId: organizer.id },
        { senderId: organizer.id, receiverId: visitor.id }
      ]
    }
  });

  for (let i = 0; i < chatMessages.length; i++) {
    const msg = chatMessages[i];
    const createdAt = new Date();
    createdAt.setMinutes(createdAt.getMinutes() - (chatMessages.length - i) * 30);
    await prisma.chatMessage.create({
      data: {
        ...msg,
        createdAt,
        readAt: i < chatMessages.length - 1 ? createdAt : null
      }
    });
  }

  // ─── Check-in participant ─────────────────────────────────────────────────

  // Mark the approved visitor as checked in for the event
  const participant = await prisma.eventParticipant.findFirst({
    where: { eventId: event.id, userId: visitor.id }
  });
  if (participant) {
    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: { checkedInAt: new Date() }
    });
  }

  console.log('Seed complete.');
  console.log(`Admin: admin@uaetrails.app / ${credentials.admin}`);
  console.log(`Organizer: organizer@uaetrails.app / ${credentials.organizer}`);
  console.log(`Guide: guide@uaetrails.app / ${credentials.guide}`);
  console.log(`Visitor: visitor@uaetrails.app / ${credentials.visitor}`);
  console.log(`Pending Visitor: visitor2@uaetrails.app / ${credentials.pendingVisitor}`);
  console.log(`Organizer tenant id: ${tenant.id}`);
  console.log(`Seeded by admin id: ${admin.id}`);
  console.log(`Merchant profile: ${merchantProfile.shopName} (${seedProducts.length} products)`);
  console.log(`Chat messages: ${chatMessages.length} seeded`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
