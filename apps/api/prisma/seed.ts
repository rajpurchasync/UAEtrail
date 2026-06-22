import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  Accessibility,
  ActivityType,
  Difficulty,
  EventStatus,
  OrganizerApplicationStatus,
  MembershipRole,
  NotificationType,
  PostCategory,
  PrismaClient,
  ProductStatus,
  RequestStatus,
  RewardAction,
  ReviewTargetType,
  MembershipTier,
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
  pendingVisitor: 'Visitor2@12345',
  suspended: 'Suspended@12345',
  guide2: 'Guide2@12345'
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
  const referralCode =
    email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase().padEnd(6, '0') +
    crypto.randomBytes(2).toString('hex').toUpperCase();
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
      referralCode,
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

const demoAvatar = (key: string) => `https://i.pravatar.cc/150?u=${encodeURIComponent(key)}`;

const setDemoAvatar = async (userId: string, key: string) => {
  await prisma.profile.update({
    where: { userId },
    data: { avatarUrl: demoAvatar(key) }
  });
};

async function main() {
  if (process.env.NODE_ENV === 'production') {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      console.log('[seed] Skipping demo seed in production. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create an admin user.');
      return;
    }
    await upsertUser({
      email: adminEmail,
      password: adminPassword,
      role: UserRole.PLATFORM_ADMIN,
      displayName: 'Platform Admin'
    });
    console.log(`[seed] Production admin ensured: ${adminEmail}`);
    return;
  }

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

  // Suspended user — for admin user-management testing
  const suspendedHash = await bcrypt.hash(credentials.suspended, 10);
  const suspendedUser = await prisma.user.upsert({
    where: { email: 'suspended@uaetrails.app' },
    update: { status: UserStatus.SUSPENDED },
    create: {
      email: 'suspended@uaetrails.app',
      passwordHash: suspendedHash,
      referralCode: 'SUSP01',
      role: UserRole.VISITOR,
      status: UserStatus.SUSPENDED,
      emailVerifiedAt: new Date()
    }
  });
  await prisma.profile.upsert({
    where: { userId: suspendedUser.id },
    update: { displayName: 'Suspended User' },
    create: { userId: suspendedUser.id, displayName: 'Suspended User' }
  });

  // Second guide who owns a guide-owned tenant
  const guide2 = await upsertUser({
    email: 'guide2@uaetrails.app',
    password: credentials.guide2,
    role: UserRole.TENANT_OWNER,
    displayName: 'Desert Explorer Guide'
  });

  await Promise.all([
    setDemoAvatar(organizer.id, 'organizer'),
    setDemoAvatar(guide.id, 'guide'),
    setDemoAvatar(visitor.id, 'visitor'),
    setDemoAvatar(guide2.id, 'guide2'),
    setDemoAvatar(admin.id, 'admin')
  ]);

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

  await prisma.profile.update({
    where: { userId: organizer.id },
    data: {
      bio: 'UAE-based adventure company specializing in guided hiking and camping across the Emirates. Safety-first trips with small groups and experienced local guides.',
    }
  });

  await prisma.organizerApplication.upsert({
    where: { id: 'seed-app-uae-adventure' },
    update: {
      applicantId: organizer.id,
      requestedTenantId: tenant.id,
      requestedName: tenant.name,
      requestedSlug: tenant.slug,
      requestedType: TenantType.COMPANY,
      status: OrganizerApplicationStatus.APPROVED,
      metadata: {
        phone: '+971 50 123 4567',
        nationality: 'UAE',
        residence: 'UAE',
        experience: '5+ years',
        languages: 'English, Arabic',
        certificates: 'Wilderness First Aid, UAE Mountain Guide certification, Leave No Trace trainer',
        notableHikes: 'Jebel Jais summit routes, Wadi Shawka loop, Hatta dam trails',
      }
    },
    create: {
      id: 'seed-app-uae-adventure',
      applicantId: organizer.id,
      requestedTenantId: tenant.id,
      requestedName: tenant.name,
      requestedSlug: tenant.slug,
      requestedType: TenantType.COMPANY,
      status: OrganizerApplicationStatus.APPROVED,
      metadata: {
        phone: '+971 50 123 4567',
        nationality: 'UAE',
        residence: 'UAE',
        experience: '5+ years',
        languages: 'English, Arabic',
        certificates: 'Wilderness First Aid, UAE Mountain Guide certification, Leave No Trace trainer',
        notableHikes: 'Jebel Jais summit routes, Wadi Shawka loop, Hatta dam trails',
      }
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

  // ─── Second Tenant (GUIDE_OWNED) ─────────────────────────────────────────

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'desert-explorer' },
    update: {
      name: 'Desert Explorer',
      type: TenantType.GUIDE_OWNED,
      status: TenantStatus.ACTIVE,
      ownerId: guide2.id
    },
    create: {
      id: 'tenant-desert-explorer',
      name: 'Desert Explorer',
      slug: 'desert-explorer',
      type: TenantType.GUIDE_OWNED,
      status: TenantStatus.ACTIVE,
      ownerId: guide2.id
    }
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant2.id,
        userId: guide2.id
      }
    },
    update: { role: MembershipRole.TENANT_OWNER },
    create: {
      tenantId: tenant2.id,
      userId: guide2.id,
      role: MembershipRole.TENANT_OWNER
    }
  });

  // ─── Pending Organizer Application ────────────────────────────────────────

  await prisma.organizerApplication.upsert({
    where: { id: 'seed-app-pending' },
    update: {
      applicantId: pendingVisitor.id,
      requestedName: 'Hatta Hiking Club',
      requestedSlug: 'hatta-hiking-club',
      requestedType: TenantType.COMPANY,
      status: 'PENDING' as never
    },
    create: {
      id: 'seed-app-pending',
      applicantId: pendingVisitor.id,
      requestedName: 'Hatta Hiking Club',
      requestedSlug: 'hatta-hiking-club',
      requestedType: TenantType.COMPANY
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
      highlights: ['Summit views', 'Rock formations', 'Wildlife spotting', 'Via Ferrata option'],
      surfaceType: ['rocky', 'gravel'],
      tags: ['summit', 'mountain', 'hard'],
      accessibleBy: ['car', '4x4'],
      parkingLink: 'https://www.google.com/maps/search/?api=1&query=Jebel+Jais+Viewing+Deck+Parking',
      gpxKey: 'locations/jebel-jais-summit-trail.gpx',
      unlockPriceAed: 29,
      guidePreview: 'Summit approach from the viewing deck parking — includes waypoints, water stops, and winter wind advisories.',
      guideMarkdown: `## Getting there
Park at the Jebel Jais Viewing Deck lot (linked above). Arrive before 6 AM in winter for parking and calm winds.

## Route overview
12.5 km out-and-back with ~900 m gain. The first 3 km are gradual; the final push to the summit is exposed and rocky.

## What to pack
- 3 L water minimum per person
- Layers — summit can be 10°C cooler than the car park
- Headlamp if starting pre-dawn

## Safety notes
- No water on trail — fill up at the car park
- Phone signal is weak past km 8; download the GPX before you go
- Turn back if winds exceed 40 km/h on the ridge

## Guide on call
Your unlock includes access to our guide support line during your hike window (same day as download).`
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
      highlights: ['Natural pools', 'Canyon views', 'Family friendly', 'Dam viewpoint'],
      surfaceType: ['sand', 'rocky'],
      tags: ['wadi', 'family', 'pools'],
      accessibleBy: ['car', '4x4'],
      parkingLink: 'https://www.google.com/maps/search/?api=1&query=Wadi+Shawka+Dam',
      gpxKey: 'locations/wadi-shawka-loop.gpx',
      unlockPriceAed: 19,
      guidePreview: 'Family-friendly wadi loop with pool stops — includes seasonal water levels and 4×4 parking notes.',
      guideMarkdown: `## Getting there
Use the Wadi Shawka Dam parking area. Standard cars can reach in dry season; check recent rain before you go.

## Route overview
8 km loop, moderate difficulty. Follow the wadi bed counter-clockwise — pools are best after winter rains.

## Family tips
- Shaded lunch spots at km 3 and km 5
- Child-friendly sections are marked in the GPX waypoints

## Guide on call
Unlock includes same-day guide support while you're on the trail.`
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
      images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800'],
      featured: true,
      campingType: 'operator-led',
      latitude: 25.2200,
      longitude: 55.8500,
      highlights: ['Stargazing', 'Fossil hunting', 'Desert sunrise', 'BBQ area'],
      surfaceType: ['sand'],
      tags: ['desert', 'camping', 'stargazing'],
      accessibleBy: ['4x4', 'car'],
      parkingLink: 'https://www.google.com/maps/search/?api=1&query=Fossil+Rock+Sharjah',
      unlockPriceAed: 25,
      guidePreview: 'Desert camp setup guide — access tracks, wind shelter spots, and stargazing orientation.',
      guideMarkdown: `## Access
4×4 recommended for the final 2 km of soft sand. Pin the Fossil Rock parking coordinate before leaving tarmac.

## Camp setup
- Set tents behind the eastern rock face for wind protection
- Fire pits are not permitted — use raised BBQ stands only

## What the full guide includes
Overnight checklist, emergency contacts, and best months for clear skies.`
    },
    {
      id: 'dibba-beach-camp',
      name: 'Dibba Beach Camp',
      region: 'Fujairah',
      activityType: ActivityType.CAMPING,
      description: 'Beach camping on the Gulf of Oman with the Hajar Mountains as a backdrop. Popular weekend spot for swimming, snorkelling, and stargazing.',
      season: ['winter', 'year-round'],
      childFriendly: true,
      maxGroupSize: 16,
      accessibility: Accessibility.CAR_ACCESSIBLE,
      images: ['https://images.unsplash.com/photo-1683028135155-7638f285b662?w=800'],
      featured: true,
      campingType: 'self-guided',
      latitude: 25.6197,
      longitude: 56.2728,
      highlights: ['Mountain views', 'Calm water', 'Beach camping', 'Snorkelling'],
      surfaceType: ['sand', 'rocky'],
      tags: ['beach', 'dibba', 'camping', 'fujairah'],
      accessibleBy: ['car', '4x4'],
      parkingLink: 'https://www.google.com/maps/search/?api=1&query=Dibba+Beach+Fujairah',
      unlockPriceAed: 19,
      guidePreview: 'Beach camp zones, tide notes, and snorkel spots along the Dibba shoreline.',
      guideMarkdown: `## Getting there
Follow E99 north from Fujairah city. Park on the hard sand near Faqiat/Dibba public beach areas.

## Camping tips
- Arrive before sunset on busy weekends
- Keep tents above the high-tide line

## What the guide includes
Wind shelter notes, BBQ etiquette, and nearby shop stops.`
    },
    {
      id: 'hatta-dam-loop',
      name: 'Hatta Dam Loop',
      region: 'Dubai',
      activityType: ActivityType.HIKING,
      difficulty: Difficulty.EASY,
      description: 'Easy lakeside loop around Hatta Dam with Hajar mountain views. Ideal for families and first-time hikers in the UAE.',
      season: ['winter', 'year-round'],
      childFriendly: true,
      images: ['https://images.unsplash.com/photo-1646641678252-52aee3025261?w=800'],
      featured: true,
      distance: 4.5,
      duration: 2,
      elevation: 120,
      latitude: 24.7847,
      longitude: 56.1136,
      highlights: ['Dam views', 'Kayak rentals', 'Mountain backdrop', 'Family friendly'],
      surfaceType: ['gravel', 'rocky'],
      tags: ['hatta', 'dam', 'family', 'easy'],
      accessibleBy: ['car'],
      parkingLink: 'https://www.google.com/maps/search/?api=1&query=Hatta+Dam',
      unlockPriceAed: 15,
      guidePreview: 'Short dam loop with parking, kayak hire, and shaded picnic stops.',
      guideMarkdown: `## Getting there
Drive via Dubai–Hatta Road (E44). Main car park is signed at the dam visitor area.

## Route
4.5 km loop on marked paths — flat with optional kayak add-on.

## Family tips
- Toilets and cafés at the dam
- Best light for photos is late afternoon`
    },
    {
      id: 'al-ain-desert-camp',
      name: 'Al Ain Desert Camp',
      region: 'Al Ain',
      activityType: ActivityType.CAMPING,
      description: 'Open desert camping south of Al Ain among rolling dunes. Quiet overnight spot for stargazing away from city lights.',
      season: ['winter'],
      childFriendly: true,
      maxGroupSize: 12,
      accessibility: Accessibility.REMOTE,
      images: ['https://images.unsplash.com/photo-1753703986788-2ac0aa05b728?w=800'],
      featured: false,
      campingType: 'self-guided',
      latitude: 24.0500,
      longitude: 55.5500,
      highlights: ['Sand dunes', 'Stargazing', 'Sunrise views', 'Quiet desert'],
      surfaceType: ['sand'],
      tags: ['desert', 'camping', 'al ain', 'dunes'],
      accessibleBy: ['4x4', 'car'],
      parkingLink: 'https://www.google.com/maps/search/?api=1&query=Al+Ain+desert+camping',
      unlockPriceAed: 19,
      guidePreview: 'Dune camp access tracks, wind orientation, and leave-no-trace checklist.',
      guideMarkdown: `## Access
4×4 advised after rain. Pin your camp before leaving the graded track.

## Overnight
- Face tents away from prevailing wind
- No ground fires — use raised BBQ stands

## Safety
Share your live location and carry extra water in summer months.`
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
      meetingPoint: 'Jebel Jais Base Parking',
      meetingLat: 25.9433,
      meetingLng: 56.1422,
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
      meetingLat: 25.9433,
      meetingLng: 56.1422,
      itinerary: ['Meet at 6:00 AM', 'Summit climb', 'Return by noon'],
      requirements: ['Water 2L', 'Hiking shoes', 'Cap and sunscreen'],
      priceAed: 120,
      capacity: 15,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });

  // ─── Second Event (tenant2 — Desert Explorer) ────────────────────────────

  const start2 = new Date();
  start2.setDate(start2.getDate() + 14);
  start2.setHours(16, 0, 0, 0);

  await prisma.event.upsert({
    where: { id: 'seed-event-fossil-camp' },
    update: {
      tenantId: tenant2.id,
      locationId: 'fossil-rock-desert-camp',
      createdById: guide2.id,
      title: 'Fossil Rock Overnight Camp',
      description: 'Desert camping with stargazing and sunrise photography.',
      startAt: start2,
      meetingPoint: 'Sharjah Desert Road (coordinates shared upon booking)',
      meetingLat: 25.2185,
      meetingLng: 55.8521,
      priceAed: 200,
      capacity: 12,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    },
    create: {
      id: 'seed-event-fossil-camp',
      tenantId: tenant2.id,
      locationId: 'fossil-rock-desert-camp',
      createdById: guide2.id,
      title: 'Fossil Rock Overnight Camp',
      description: 'Desert camping with stargazing and sunrise photography.',
      startAt: start2,
      meetingPoint: 'Sharjah Desert Road (coordinates shared upon booking)',
      meetingLat: 25.2185,
      meetingLng: 55.8521,
      itinerary: ['Arrive by 4 PM', 'Set up camp', 'Sunset BBQ', 'Stargazing session', 'Sunrise photography'],
      requirements: ['Sleeping bag', 'Warm jacket', 'Camera (optional)', 'Water 3L'],
      priceAed: 200,
      capacity: 12,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });

  // ─── Free community trips ────────────────────────────────────────────────

  const freeHikeStart = new Date();
  freeHikeStart.setDate(freeHikeStart.getDate() + 10);
  freeHikeStart.setHours(7, 0, 0, 0);

  await prisma.event.upsert({
    where: { id: 'seed-event-shawka-free' },
    update: {
      tenantId: tenant.id,
      locationId: 'wadi-shawka-loop',
      createdById: organizer.id,
      guideId: guide.id,
      title: 'Wadi Shawka Community Hike',
      description: 'Free guided group hike through Wadi Shawka — open to all skill levels. A great intro to UAE trail culture with no cost to join.',
      startAt: freeHikeStart,
      meetingPoint: 'Wadi Shawka Dam parking',
      meetingLat: 25.3385,
      meetingLng: 56.1188,
      priceAed: 0,
      capacity: 20,
      featured: true,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    },
    create: {
      id: 'seed-event-shawka-free',
      tenantId: tenant.id,
      locationId: 'wadi-shawka-loop',
      createdById: organizer.id,
      guideId: guide.id,
      title: 'Wadi Shawka Community Hike',
      description: 'Free guided group hike through Wadi Shawka — open to all skill levels. A great intro to UAE trail culture with no cost to join.',
      startAt: freeHikeStart,
      meetingPoint: 'Wadi Shawka Dam parking',
      meetingLat: 25.3385,
      meetingLng: 56.1188,
      itinerary: ['Meet at 7:00 AM', 'Loop trail through the wadi', 'Return by 11:00 AM'],
      requirements: ['Water 1.5L', 'Trail shoes', 'Sun protection'],
      priceAed: 0,
      capacity: 20,
      featured: true,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    }
  });

  const freeCampStart = new Date();
  freeCampStart.setDate(freeCampStart.getDate() + 21);
  freeCampStart.setHours(15, 0, 0, 0);

  await prisma.event.upsert({
    where: { id: 'seed-event-desert-meetup' },
    update: {
      tenantId: tenant2.id,
      locationId: 'fossil-rock-desert-camp',
      createdById: guide2.id,
      title: 'Desert Sunset Meetup (Free)',
      description: 'Free afternoon desert meetup — stargazing tips, campfire chat, and sunset views. Bring your own gear; no overnight stay required.',
      startAt: freeCampStart,
      meetingPoint: 'Fossil Rock approach road',
      meetingLat: 25.2192,
      meetingLng: 55.8495,
      priceAed: 0,
      capacity: 25,
      featured: true,
      status: EventStatus.PUBLISHED,
      publishedAt: new Date()
    },
    create: {
      id: 'seed-event-desert-meetup',
      tenantId: tenant2.id,
      locationId: 'fossil-rock-desert-camp',
      createdById: guide2.id,
      title: 'Desert Sunset Meetup (Free)',
      description: 'Free afternoon desert meetup — stargazing tips, campfire chat, and sunset views. Bring your own gear; no overnight stay required.',
      startAt: freeCampStart,
      meetingPoint: 'Fossil Rock approach road',
      meetingLat: 25.2192,
      meetingLng: 55.8495,
      itinerary: ['Arrive by 3 PM', 'Sunset viewpoint', 'Campfire & stargazing intro', 'Wrap up by 9 PM'],
      requirements: ['Chair or mat', 'Warm layer', 'Snacks & water'],
      priceAed: 0,
      capacity: 25,
      featured: true,
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

  const seedParticipant = async (userId: string, reviewerId: string) => {
    const approved = await prisma.eventRequest.upsert({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId
        }
      },
      update: {
        status: RequestStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date()
      },
      create: {
        eventId: event.id,
        userId,
        status: RequestStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date()
      }
    });
    await prisma.eventParticipant.upsert({
      where: { requestId: approved.id },
      update: {
        eventId: event.id,
        userId,
        approvedById: reviewerId
      },
      create: {
        eventId: event.id,
        userId,
        requestId: approved.id,
        approvedById: reviewerId
      }
    });
  };

  await seedParticipant(guide.id, organizer.id);
  await seedParticipant(admin.id, organizer.id);

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

  // ─── Reviews, community posts & in-app notifications ─────────────────────

  await prisma.review.upsert({
    where: {
      userId_targetType_targetId: {
        userId: visitor.id,
        targetType: ReviewTargetType.LOCATION,
        targetId: 'wadi-shawka-loop'
      }
    },
    update: {
      rating: 5,
      comment: 'Beautiful wadi with easy access. Perfect for a morning hike with friends.'
    },
    create: {
      userId: visitor.id,
      targetType: ReviewTargetType.LOCATION,
      targetId: 'wadi-shawka-loop',
      rating: 5,
      comment: 'Beautiful wadi with easy access. Perfect for a morning hike with friends.'
    }
  });

  await prisma.review.upsert({
    where: {
      userId_targetType_targetId: {
        userId: visitor.id,
        targetType: ReviewTargetType.TENANT,
        targetId: tenant.id
      }
    },
    update: {
      rating: 5,
      comment: 'UAE Adventure Co runs well-organized trips with clear communication and safety briefings.'
    },
    create: {
      userId: visitor.id,
      targetType: ReviewTargetType.TENANT,
      targetId: tenant.id,
      rating: 5,
      comment: 'UAE Adventure Co runs well-organized trips with clear communication and safety briefings.'
    }
  });

  await prisma.review.upsert({
    where: {
      userId_targetType_targetId: {
        userId: guide.id,
        targetType: ReviewTargetType.LOCATION,
        targetId: 'jebel-jais-summit-trail'
      }
    },
    update: {
      rating: 4,
      comment: 'Challenging but rewarding summit trail. Start early and bring layers for the summit.'
    },
    create: {
      userId: guide.id,
      targetType: ReviewTargetType.LOCATION,
      targetId: 'jebel-jais-summit-trail',
      rating: 4,
      comment: 'Challenging but rewarding summit trail. Start early and bring layers for the summit.'
    }
  });

  const seedPost = await prisma.post.upsert({
    where: { id: 'seed-post-shawka-tips' },
    update: {
      title: 'Best time to hike Wadi Shawka',
      content: 'Early morning in winter is ideal — cooler temps and great light. Bring at least 2L of water per person.',
      category: PostCategory.TIPS,
      locationId: 'wadi-shawka-loop',
      authorId: organizer.id,
      images: []
    },
    create: {
      id: 'seed-post-shawka-tips',
      category: PostCategory.TIPS,
      title: 'Best time to hike Wadi Shawka',
      content: 'Early morning in winter is ideal — cooler temps and great light. Bring at least 2L of water per person.',
      images: [],
      locationId: 'wadi-shawka-loop',
      authorId: organizer.id
    }
  });

  await prisma.postReply.upsert({
    where: { id: 'seed-reply-shawka-1' },
    update: {
      content: 'Agreed — we went last January at 6am and it was perfect. Parking fills up by 8am on weekends.'
    },
    create: {
      id: 'seed-reply-shawka-1',
      postId: seedPost.id,
      authorId: visitor.id,
      content: 'Agreed — we went last January at 6am and it was perfect. Parking fills up by 8am on weekends.'
    }
  });

  await prisma.post.upsert({
    where: { id: 'seed-post-gear-question' },
    update: {
      title: 'What shoes for Jebel Jais?',
      content: 'Planning my first summit hike — are trail runners enough or do I need proper hiking boots?',
      category: PostCategory.QUESTIONS,
      authorId: visitor.id,
      images: []
    },
    create: {
      id: 'seed-post-gear-question',
      category: PostCategory.QUESTIONS,
      title: 'What shoes for Jebel Jais?',
      content: 'Planning my first summit hike — are trail runners enough or do I need proper hiking boots?',
      images: [],
      authorId: visitor.id
    }
  });

  await prisma.notification.upsert({
    where: { id: 'seed-notif-visitor-approved' },
    update: {
      title: 'Join request approved',
      body: 'Your request to join a trip was approved. Check My Trips for details.',
      isRead: false
    },
    create: {
      id: 'seed-notif-visitor-approved',
      userId: visitor.id,
      title: 'Join request approved',
      body: 'Your request to join a trip was approved. Check My Trips for details.',
      type: NotificationType.REQUEST_UPDATE,
      isRead: false,
      meta: { eventId: event.id }
    }
  });

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

  // ─── Trail Points demo data ───────────────────────────────────────────────

  const seedReward = async (
    userId: string,
    action: RewardAction,
    points: number,
    referenceId: string,
    label: string
  ) => {
    try {
      await prisma.rewardLedger.create({
        data: { userId, action, points, referenceId, label }
      });
      await prisma.profile.update({
        where: { userId },
        data: { rewardPoints: { increment: points } }
      });
    } catch {
      // idempotent re-seed
    }
  };

  await seedReward(visitor.id, RewardAction.SIGNUP_WELCOME, 25, visitor.id, 'Welcome bonus');
  await seedReward(visitor.id, RewardAction.TRIP_ATTENDED, 30, `${event.id}:${visitor.id}`, 'Attended a trip');
  await seedReward(visitor.id, RewardAction.COMMUNITY_POST, 20, 'seed-post-1', 'Community post');
  await seedReward(organizer.id, RewardAction.EVENT_PUBLISHED, 50, event.id, 'Published a trip');
  await seedReward(organizer.id, RewardAction.EVENT_HOSTED, 75, event.id, 'Hosted a trip');

  await prisma.profile.update({
    where: { userId: organizer.id },
    data: { membershipTier: MembershipTier.ACTIVE }
  });
  try {
    await prisma.userBadge.create({ data: { userId: organizer.id, badgeKey: 'tier_active' } });
    await prisma.userBadge.create({ data: { userId: organizer.id, badgeKey: 'trip_leader' } });
  } catch {
    // idempotent
  }

  console.log('Seed complete.');
  console.log(`Admin: admin@uaetrails.app / ${credentials.admin}`);
  console.log(`Organizer: organizer@uaetrails.app / ${credentials.organizer}`);
  console.log(`Guide: guide@uaetrails.app / ${credentials.guide}`);
  console.log(`Guide2 (tenant owner): guide2@uaetrails.app / ${credentials.guide2}`);
  console.log(`Visitor: visitor@uaetrails.app / ${credentials.visitor}`);
  console.log(`Pending Visitor: visitor2@uaetrails.app / ${credentials.pendingVisitor}`);
  console.log(`Suspended: suspended@uaetrails.app / ${credentials.suspended}`);
  console.log(`Tenant 1 (COMPANY): ${tenant.id} — ${tenant.slug}`);
  console.log(`Tenant 2 (GUIDE_OWNED): ${tenant2.id} — ${tenant2.slug}`);
  console.log(`Pending application: Hatta Hiking Club (by ${pendingVisitor.email})`);
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
