import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  Accessibility,
  ActivityType,
  AuthProvider,
  Difficulty,
  ActivityStatus,
  LocationStatus,
  MembershipRole,
  MembershipTier,
  NotificationType,
  OrganizerApplicationStatus,
  PostCategory,
  ProductStatus,
  RequestStatus,
  RewardAction,
  ReviewTargetType,
  TenantStatus,
  TenantType,
  UserRole,
  UserStatus
} from '../src/domain/enums.js';
import {
  createAuthUser,
  findAuthUserByEmail,
  updateAuthUserCore,
  updateAuthUserProfile,
  type AuthUserRecord
} from '../src/lib/auth-users.js';
import {
  buildEventFromCreateInput,
  buildLocationFromCreateInput,
  type EventCreateInput,
  type LocationCreateInput
} from '../src/lib/entity-builders.js';
import { findEventDocInMongo, findLocationInMongo, writeEventDocToMongo, writeLocationToMongo } from '../src/lib/entity-sync.js';
import { getMongoClient, connectMongo, disconnectMongo } from '../src/lib/mongo.js';
import { createRewardLedgerEntry, createUserBadge } from '../src/lib/reward-ledger-store.js';
import { createSocialReview } from '../src/lib/social-data.js';
import {
  createMerchantProfileForUser,
  findManagedMerchantProfileById
} from '../src/lib/shop-store.js';
import { upsertTenantMembership } from '../src/lib/tenant-access.js';
import {
  createTenantRecord,
  findTenantBySlug,
  writeTenantToMongo,
  type TenantRecord
} from '../src/lib/tenant-store.js';

const db = () => getMongoClient()!.db();

const credentials = {
  admin: 'Admin@12345',
  organizer: 'Organizer@12345',
  guide: 'Guide@12345',
  visitor: 'Visitor@12345',
  pendingVisitor: 'Visitor2@12345',
  suspended: 'Suspended@12345',
  guide2: 'Guide2@12345'
};

const demoAvatar = (key: string) => `https://i.pravatar.cc/150?u=${encodeURIComponent(key)}`;

const buildReferralCode = (email: string) =>
  email.split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase().padEnd(6, '0') +
  crypto.randomBytes(2).toString('hex').toUpperCase();

const upsertUser = async ({
  email,
  password,
  role,
  displayName
}: {
  email: string;
  password: string;
  role: AuthUserRecord['role'];
  displayName: string;
}): Promise<AuthUserRecord> => {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    await updateAuthUserCore({
      userId: existing._id,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    });
    await updateAuthUserProfile(existing._id, { displayName });
    const updated = await findAuthUserByEmail(email);
    if (!updated) throw new Error(`Failed to update user: ${email}`);
    return updated;
  }

  return createAuthUser({
    email,
    passwordHash,
    googleId: null,
    authProvider: AuthProvider.EMAIL,
    role,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    referralCode: buildReferralCode(email),
    profile: { displayName, phone: null, bio: null, avatarUrl: null }
  });
};

const setDemoAvatar = async (userId: string, key: string) => {
  await updateAuthUserProfile(userId, { avatarUrl: demoAvatar(key) });
};

const upsertTenant = async (input: {
  id: string;
  name: string;
  slug: string;
  type: TenantRecord['type'];
  status: TenantRecord['status'];
  ownerId: string;
}): Promise<TenantRecord> => {
  const existing = await findTenantBySlug(input.slug);
  if (existing) {
    const updated: TenantRecord = {
      ...existing,
      name: input.name,
      type: input.type,
      status: input.status,
      ownerId: input.ownerId,
      updatedAt: new Date()
    };
    await writeTenantToMongo(updated);
    return updated;
  }

  return createTenantRecord({
    id: input.id,
    name: input.name,
    slug: input.slug,
    type: input.type,
    status: input.status,
    ownerId: input.ownerId
  });
};

const upsertLocation = async (id: string, data: LocationCreateInput) => {
  const location = buildLocationFromCreateInput({ ...data, status: LocationStatus.ACTIVE }, id);
  const existing = await findLocationInMongo(id);
  if (existing) {
    location.createdAt = existing.createdAt;
  }
  await writeLocationToMongo(location);
  return location;
};

const upsertEvent = async (id: string, data: EventCreateInput) => {
  const doc = buildEventFromCreateInput(data, id);
  const existing = await findEventDocInMongo(id);
  if (existing) {
    doc.createdAt = existing.createdAt;
  }
  await writeEventDocToMongo(doc);
  return doc;
};

const upsertOrganizerApplication = async (input: {
  id: string;
  applicantId: string;
  requestedTenantId?: string | null;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantRecord['type'];
  status?: OrganizerApplicationStatus;
  metadata?: unknown;
}) => {
  const now = new Date();
  await db().collection('organizer_applications').updateOne(
    { _id: input.id },
    {
      $set: {
        applicantId: input.applicantId,
        requestedTenantId: input.requestedTenantId ?? null,
        requestedName: input.requestedName,
        requestedSlug: input.requestedSlug,
        requestedType: input.requestedType,
        status: input.status ?? OrganizerApplicationStatus.PENDING,
        metadata: input.metadata ?? null,
        reviewerId: null,
        reviewerNote: null,
        reviewedAt: null,
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );
};

const upsertMerchantProfile = async (
  adminIds: string[],
  data: {
    shopName: string;
    description: string;
    logo?: string;
    contactEmail: string;
    contactPhone: string;
  }
) => {
  const existing = await db().collection('merchant_profiles').findOne({ shopName: data.shopName });
  if (existing) {
    const now = new Date();
    await db().collection('merchant_profiles').updateOne(
      { _id: existing._id },
      {
        $set: {
          adminIds,
          shopName: data.shopName,
          description: data.description,
          logo: data.logo ?? null,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          updatedAt: now
        }
      }
    );
    return (await findManagedMerchantProfileById(adminIds[0]!, existing._id as string))!;
  }

  const created = await createMerchantProfileForUser(adminIds[0]!, data);
  await db().collection('merchant_profiles').updateOne(
    { _id: created.id },
    { $set: { adminIds, logo: data.logo ?? null, updatedAt: new Date() } }
  );
  return (await findManagedMerchantProfileById(adminIds[0]!, created.id))!;
};

const upsertProduct = async (
  id: string,
  merchantId: string,
  product: {
    name: string;
    description: string;
    images: string[];
    priceAed: number;
    discountPercent?: number;
    packagingInfo?: string;
    category: string;
    status: ProductStatus;
  }
) => {
  const now = new Date();
  await db().collection('products').updateOne(
    { _id: id },
    {
      $set: {
        merchantId,
        name: product.name,
        description: product.description,
        images: product.images,
        priceAed: product.priceAed,
        discountPercent: product.discountPercent ?? null,
        externalUrl: null,
        packagingInfo: product.packagingInfo ?? null,
        category: product.category,
        status: product.status,
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );
};

const seedMerchantAnalytics = async (input: {
  products: Array<{ id: string; priceAed: number }>;
  userIds: string[];
}) => {
  await db().collection('product_clicks').deleteMany({ productId: { $in: input.products.map((product) => product.id) } });
  await db().collection('order_line_items').deleteMany({ productId: { $in: input.products.map((product) => product.id) } });

  const now = new Date();
  const clickDocs: Array<{ _id: string; productId: string; timestamp: Date; userId: string }> = [];
  const orderLineDocs: Array<{ _id: string; productId: string; quantity: number; totalAed: number; timestamp: Date }> = [];

  for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
    const timestamp = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOffset, 12, 0, 0, 0));
    for (const product of input.products) {
      const clickCount = crypto.randomInt(3, 12);
      for (let clickIndex = 0; clickIndex < clickCount; clickIndex += 1) {
        clickDocs.push({
          _id: crypto.randomUUID(),
          productId: product.id,
          timestamp: new Date(timestamp.getTime() + clickIndex * 60_000),
          userId: input.userIds[crypto.randomInt(0, input.userIds.length)]!
        });
      }

      const orderCount = crypto.randomInt(0, 4);
      for (let orderIndex = 0; orderIndex < orderCount; orderIndex += 1) {
        const quantity = crypto.randomInt(1, 4);
        orderLineDocs.push({
          _id: crypto.randomUUID(),
          productId: product.id,
          quantity,
          totalAed: quantity * product.priceAed,
          timestamp: new Date(timestamp.getTime() + orderIndex * 90_000)
        });
      }
    }
  }

  if (clickDocs.length > 0) {
    await db().collection('product_clicks').insertMany(clickDocs);
  }
  if (orderLineDocs.length > 0) {
    await db().collection('order_line_items').insertMany(orderLineDocs);
  }
};

const upsertReview = async (input: {
  userId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string;
}) => {
  const existing = await db().collection('social_reviews').findOne({
    userId: input.userId,
    targetType: input.targetType,
    targetId: input.targetId
  });

  if (existing) {
    await db().collection('social_reviews').updateOne(
      { _id: existing._id },
      { $set: { rating: input.rating, comment: input.comment } }
    );
    return;
  }

  await createSocialReview(input);
};

const upsertPost = async (input: {
  id: string;
  category: PostCategory;
  title: string;
  content: string;
  images: string[];
  locationId?: string;
  authorId: string;
}) => {
  const now = new Date();
  await db().collection('social_posts').updateOne(
    { _id: input.id },
    {
      $set: {
        category: input.category,
        title: input.title,
        content: input.content,
        images: input.images,
        locationId: input.locationId ?? null,
        activityId: null,
        authorId: input.authorId,
        updatedAt: now
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );
};

const upsertPostReply = async (input: {
  id: string;
  postId: string;
  authorId: string;
  content: string;
}) => {
  const now = new Date();
  await db().collection('social_post_replies').updateOne(
    { _id: input.id },
    {
      $set: {
        postId: input.postId,
        authorId: input.authorId,
        content: input.content
      },
      $setOnInsert: { createdAt: now }
    },
    { upsert: true }
  );
};

const upsertNotification = async (input: {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  meta?: unknown;
}) => {
  const existing = await db().collection('notifications').findOne({ _id: input.id });
  if (existing) {
    await db().collection('notifications').updateOne(
      { _id: input.id },
      { $set: { title: input.title, body: input.body, isRead: false } }
    );
    return;
  }

  await db().collection('notifications').insertOne({
    _id: input.id,
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type,
    isRead: false,
    meta: input.meta ?? null,
    createdAt: new Date()
  });
};

const seedParticipant = async (activityId: string, userId: string, reviewerId: string) => {
  const now = new Date();
  const existingRequest = await db().collection('activity_requests').findOne({ activityId, userId });
  const requestId = existingRequest?._id ?? crypto.randomUUID();

  await db().collection('activity_requests').updateOne(
    { activityId, userId },
    {
      $set: {
        status: RequestStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: now,
        updatedAt: now
      },
      $setOnInsert: {
        _id: requestId,
        note: null,
        organizerNote: null,
        cancelReason: null,
        cancelMessage: null,
        cancelledAt: null,
        selectedPackageIndex: null,
        createdAt: now
      }
    },
    { upsert: true }
  );

  const existingParticipant = await db().collection('activity_participants').findOne({ requestId });
  const participantId = existingParticipant?._id ?? crypto.randomUUID();

  await db().collection('activity_participants').updateOne(
    { requestId },
    {
      $set: {
        activityId,
        userId,
        approvedById: reviewerId
      },
      $setOnInsert: {
        _id: participantId,
        checkedInAt: null,
        createdAt: now
      }
    },
    { upsert: true }
  );
};

const seedReward = async (
  userId: string,
  action: RewardAction,
  points: number,
  referenceId: string,
  label: string
) => {
  try {
    await createRewardLedgerEntry({ userId, action, points, referenceId, label });
    await db().collection('auth_users').updateOne(
      { _id: userId },
      { $inc: { 'profile.rewardPoints': points }, $set: { updatedAt: new Date() } }
    );
  } catch {
    // idempotent re-seed
  }
};

const SEED_MARKER_EMAIL = 'admin@uaetrails.app';
const SEED_MARKER_EVENT_ID = 'seed-event-jais';
const SEED_MARKER_LOCATION_ID = 'jebel-jais-summit-trail';

const isProductionEnv = (): boolean => process.env.NODE_ENV === 'production';

const isSeedDataEnabled = (): boolean => {
  const values = [
    process.env.SEED_DATA,
    process.env.RUN_PROJECT_FORCE_SEED,
    process.env.FORCE_SEED
  ];
  return values.some((value) => {
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  });
};

const hasExistingSeedData = async (): Promise<boolean> => {
  const existingAdmin = await findAuthUserByEmail(SEED_MARKER_EMAIL);
  if (existingAdmin) return true;

  const existingEvent = await findEventDocInMongo(SEED_MARKER_EVENT_ID);
  if (existingEvent) return true;

  const existingLocation = await findLocationInMongo(SEED_MARKER_LOCATION_ID);
  return Boolean(existingLocation);
};

const logSeedSkip = (reason: string): void => {
  console.log(`[seed] Skipping seed: ${reason}`);
};

const shouldRunSeed = async (): Promise<boolean> => {
  if (isProductionEnv()) {
    logSeedSkip('production environment never seeds data');
    return false;
  }

  const seedEnabled = isSeedDataEnabled();
  const dataExists = await hasExistingSeedData();

  if (dataExists && !seedEnabled) {
    logSeedSkip('seed data already exists and SEED_DATA is not true');
    return false;
  }

  if (!seedEnabled) {
    logSeedSkip('SEED_DATA is not true');
    return false;
  }

  if (dataExists) {
    console.log('[seed] SEED_DATA=true — reseeding and overwriting existing demo data');
  }

  return true;
};

async function main() {
  const client = await connectMongo();
  if (!client) {
    console.error('[seed] MongoDB is not configured. Set MONGODB_URI.');
    process.exit(1);
  }

  if (!(await shouldRunSeed())) {
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

  const vendor = await upsertUser({
    email: 'vendor@uaetrails.app',
    password: 'Vendor@12345',
    role: UserRole.MERCHANT_ADMIN,
    displayName: 'Vendor Admin'
  });

  const pendingVisitor = await upsertUser({
    email: 'visitor2@uaetrails.app',
    password: credentials.pendingVisitor,
    role: UserRole.VISITOR,
    displayName: 'Pending Visitor'
  });

  const suspendedHash = await bcrypt.hash(credentials.suspended, 10);
  const suspendedExisting = await findAuthUserByEmail('suspended@uaetrails.app');
  if (suspendedExisting) {
    await updateAuthUserCore({
      userId: suspendedExisting._id,
      status: UserStatus.SUSPENDED
    });
    await updateAuthUserProfile(suspendedExisting._id, { displayName: 'Suspended User' });
  } else {
    await createAuthUser({
      email: 'suspended@uaetrails.app',
      passwordHash: suspendedHash,
      googleId: null,
      authProvider: AuthProvider.EMAIL,
      role: UserRole.VISITOR,
      status: UserStatus.SUSPENDED,
      emailVerifiedAt: new Date(),
      referralCode: 'SUSP01',
      profile: { displayName: 'Suspended User', phone: null, bio: null, avatarUrl: null }
    });
  }

  const guide2 = await upsertUser({
    email: 'guide2@uaetrails.app',
    password: credentials.guide2,
    role: UserRole.TENANT_OWNER,
    displayName: 'Desert Explorer Guide'
  });

  await Promise.all([
    setDemoAvatar(organizer._id, 'organizer'),
    setDemoAvatar(guide._id, 'guide'),
    setDemoAvatar(visitor._id, 'visitor'),
    setDemoAvatar(guide2._id, 'guide2'),
    setDemoAvatar(admin._id, 'admin')
  ]);

  const tenant = await upsertTenant({
    id: 'tenant-uae-adventure',
    name: 'UAE Adventure Co',
    slug: 'uae-adventure-co',
    type: TenantType.COMPANY,
    status: TenantStatus.ACTIVE,
    ownerId: organizer._id
  });

  await upsertTenantMembership({
    tenantId: tenant.id,
    userId: organizer._id,
    role: MembershipRole.TENANT_OWNER
  });

  await updateAuthUserProfile(organizer._id, {
    bio: 'UAE-based adventure company specializing in guided hiking and camping across the Emirates. Safety-first trips with small groups and experienced local guides.'
  });

  await upsertOrganizerApplication({
    id: 'seed-app-uae-adventure',
    applicantId: organizer._id,
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
      notableHikes: 'Jebel Jais summit routes, Wadi Shawka loop, Hatta dam trails'
    }
  });

  await upsertTenantMembership({
    tenantId: tenant.id,
    userId: guide._id,
    role: MembershipRole.TENANT_GUIDE
  });

  const tenant2 = await upsertTenant({
    id: 'tenant-desert-explorer',
    name: 'Desert Explorer',
    slug: 'desert-explorer',
    type: TenantType.GUIDE_OWNED,
    status: TenantStatus.ACTIVE,
    ownerId: guide2._id
  });

  await upsertTenantMembership({
    tenantId: tenant2.id,
    userId: guide2._id,
    role: MembershipRole.TENANT_OWNER
  });

  await upsertOrganizerApplication({
    id: 'seed-app-pending',
    applicantId: pendingVisitor._id,
    requestedName: 'Hatta Hiking Club',
    requestedSlug: 'hatta-hiking-club',
    requestedType: TenantType.COMPANY,
    status: OrganizerApplicationStatus.PENDING
  });

  const seedLocations: Array<{ id: string; data: LocationCreateInput }> = [
    {
      id: 'jebel-jais-summit-trail',
      data: {
        name: 'Jebel Jais Summit Trail',
        region: 'RAK',
        activityType: ActivityType.HIKING,
        difficulty: Difficulty.HARD,
        description:
          'A demanding mountain route with panoramic views of the Hajar Mountains. The trail traverses rugged terrain with steep ascents and descents, rewarding hikers with breathtaking vistas from the highest peak in the UAE.',
        season: ['winter', 'year-round'],
        childFriendly: false,
        images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
        featured: true,
        distance: 12.5,
        duration: 6,
        elevation: 1934,
        latitude: 25.9545,
        longitude: 56.273,
        highlights: ['Summit views', 'Rock formations', 'Wildlife spotting', 'Via Ferrata option'],
        surfaceType: ['rocky', 'gravel'],
        tags: ['summit', 'mountain', 'hard'],
        accessibleBy: ['car', '4x4'],
        parkingLink: 'https://www.google.com/maps/search/?api=1&query=Jebel+Jais+Viewing+Deck+Parking',
        gpxKey: 'locations/jebel-jais-summit-trail.gpx',
        unlockPriceAed: 29,
        guidePreview:
          'Summit approach from the viewing deck parking — includes waypoints, water stops, and winter wind advisories.',
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
      }
    },
    {
      id: 'wadi-shawka-loop',
      data: {
        name: 'Wadi Shawka Loop',
        region: 'RAK',
        activityType: ActivityType.HIKING,
        difficulty: Difficulty.MODERATE,
        description:
          'Scenic wadi route suitable for groups with beautiful pools and rock formations. The trail follows the seasonal riverbed through dramatic canyon walls.',
        season: ['winter', 'year-round'],
        childFriendly: true,
        images: ['https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800'],
        featured: true,
        distance: 8,
        duration: 4,
        elevation: 450,
        latitude: 25.34,
        longitude: 56.12,
        highlights: ['Natural pools', 'Canyon views', 'Family friendly', 'Dam viewpoint'],
        surfaceType: ['sand', 'rocky'],
        tags: ['wadi', 'family', 'pools'],
        accessibleBy: ['car', '4x4'],
        parkingLink: 'https://www.google.com/maps/search/?api=1&query=Wadi+Shawka+Dam',
        gpxKey: 'locations/wadi-shawka-loop.gpx',
        unlockPriceAed: 19,
        guidePreview:
          'Family-friendly wadi loop with pool stops — includes seasonal water levels and 4×4 parking notes.',
        guideMarkdown: `## Getting there
Use the Wadi Shawka Dam parking area. Standard cars can reach in dry season; check recent rain before you go.

## Route overview
8 km loop, moderate difficulty. Follow the wadi bed counter-clockwise — pools are best after winter rains.

## Family tips
- Shaded lunch spots at km 3 and km 5
- Child-friendly sections are marked in the GPX waypoints

## Guide on call
Unlock includes same-day guide support while you're on the trail.`
      }
    },
    {
      id: 'fossil-rock-desert-camp',
      data: {
        name: 'Fossil Rock Desert Camp',
        region: 'Sharjah',
        activityType: ActivityType.CAMPING,
        description:
          'Popular desert camping location for group overnights near the iconic Fossil Rock formation. Perfect for stargazing and exploring the surrounding desert landscape.',
        season: ['winter'],
        childFriendly: true,
        maxGroupSize: 20,
        accessibility: Accessibility.REMOTE,
        images: ['https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800'],
        featured: true,
        campingType: 'operator-led',
        latitude: 25.22,
        longitude: 55.85,
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
      }
    },
    {
      id: 'dibba-beach-camp',
      data: {
        name: 'Dibba Beach Camp',
        region: 'Fujairah',
        activityType: ActivityType.CAMPING,
        description:
          'Beach camping on the Gulf of Oman with the Hajar Mountains as a backdrop. Popular weekend spot for swimming, snorkelling, and stargazing.',
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
      }
    },
    {
      id: 'hatta-dam-loop',
      data: {
        name: 'Hatta Dam Loop',
        region: 'Dubai',
        activityType: ActivityType.HIKING,
        difficulty: Difficulty.EASY,
        description:
          'Easy lakeside loop around Hatta Dam with Hajar mountain views. Ideal for families and first-time hikers in the UAE.',
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
      }
    },
    {
      id: 'al-ain-desert-camp',
      data: {
        name: 'Al Ain Desert Camp',
        region: 'Al Ain',
        activityType: ActivityType.CAMPING,
        description:
          'Open desert camping south of Al Ain among rolling dunes. Quiet overnight spot for stargazing away from city lights.',
        season: ['winter'],
        childFriendly: true,
        maxGroupSize: 12,
        accessibility: Accessibility.REMOTE,
        images: ['https://images.unsplash.com/photo-1753703986788-2ac0aa05b728?w=800'],
        featured: false,
        campingType: 'self-guided',
        latitude: 24.05,
        longitude: 55.55,
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
    }
  ];

  for (const location of seedLocations) {
    await upsertLocation(location.id, location.data);
  }

  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(6, 0, 0, 0);

  const event = await upsertEvent('seed-event-jais', {
    tenant: { connect: { id: tenant.id } },
    location: { connect: { id: 'jebel-jais-summit-trail' } },
    createdBy: { connect: { id: organizer._id } },
    guide: { connect: { id: guide._id } },
    title: 'Jebel Jais Group Hike',
    description: 'Guided early morning summit trek.',
    startAt: start,
    meetingPoint: 'Jebel Jais Base Parking',
    meetingLat: 25.9433,
    meetingLng: 56.1422,
    priceAed: 120,
    capacity: 15,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet at 6:00 AM', 'Summit climb', 'Return by noon'],
    requirements: ['Water 2L', 'Hiking shoes', 'Cap and sunscreen']
  });

  const start2 = new Date();
  start2.setDate(start2.getDate() + 14);
  start2.setHours(16, 0, 0, 0);

  await upsertEvent('seed-event-fossil-camp', {
    tenant: { connect: { id: tenant2.id } },
    location: { connect: { id: 'fossil-rock-desert-camp' } },
    createdBy: { connect: { id: guide2._id } },
    title: 'Fossil Rock Overnight Camp',
    description: 'Desert camping with stargazing and sunrise photography.',
    startAt: start2,
    meetingPoint: 'Sharjah Desert Road (coordinates shared upon booking)',
    meetingLat: 25.2185,
    meetingLng: 55.8521,
    priceAed: 200,
    capacity: 12,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: [
      'Arrive by 4 PM',
      'Set up camp',
      'Sunset BBQ',
      'Stargazing session',
      'Sunrise photography'
    ],
    requirements: ['Sleeping bag', 'Warm jacket', 'Camera (optional)', 'Water 3L']
  });

  const freeHikeStart = new Date();
  freeHikeStart.setDate(freeHikeStart.getDate() + 10);
  freeHikeStart.setHours(7, 0, 0, 0);

  await upsertEvent('seed-event-shawka-free', {
    tenant: { connect: { id: tenant.id } },
    location: { connect: { id: 'wadi-shawka-loop' } },
    createdBy: { connect: { id: organizer._id } },
    guide: { connect: { id: guide._id } },
    title: 'Wadi Shawka Community Hike',
    description:
      'Free guided group hike through Wadi Shawka — open to all skill levels. A great intro to UAE trail culture with no cost to join.',
    startAt: freeHikeStart,
    meetingPoint: 'Wadi Shawka Dam parking',
    meetingLat: 25.3385,
    meetingLng: 56.1188,
    priceAed: 0,
    capacity: 20,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet at 7:00 AM', 'Loop trail through the wadi', 'Return by 11:00 AM'],
    requirements: ['Water 1.5L', 'Trail shoes', 'Sun protection']
  });

  const freeCampStart = new Date();
  freeCampStart.setDate(freeCampStart.getDate() + 21);
  freeCampStart.setHours(15, 0, 0, 0);

  await upsertEvent('seed-event-desert-meetup', {
    tenant: { connect: { id: tenant2.id } },
    location: { connect: { id: 'fossil-rock-desert-camp' } },
    createdBy: { connect: { id: guide2._id } },
    title: 'Desert Sunset Meetup (Free)',
    description:
      'Free afternoon desert meetup — stargazing tips, campfire chat, and sunset views. Bring your own gear; no overnight stay required.',
    startAt: freeCampStart,
    meetingPoint: 'Fossil Rock approach road',
    meetingLat: 25.2192,
    meetingLng: 55.8495,
    priceAed: 0,
    capacity: 25,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: [
      'Arrive by 3 PM',
      'Sunset viewpoint',
      'Campfire & stargazing intro',
      'Wrap up by 9 PM'
    ],
    requirements: ['Chair or mat', 'Warm layer', 'Snacks & water']
  });

  await seedParticipant(event._id, visitor._id, organizer._id);

  const approvedRequest = await db().collection('activity_requests').findOne({
    activityId: event._id,
    userId: visitor._id
  });
  if (approvedRequest) {
    await db().collection('activity_requests').updateOne(
      { _id: approvedRequest._id },
      {
        $set: {
          organizerNote: 'Approved, see you on the trail.',
          updatedAt: new Date()
        }
      }
    );
  }

  await seedParticipant(event._id, guide._id, organizer._id);
  await seedParticipant(event._id, admin._id, organizer._id);

  const pendingNow = new Date();
  await db().collection('activity_requests').updateOne(
    { activityId: event._id, userId: pendingVisitor._id },
    {
      $set: {
        status: RequestStatus.PENDING,
        note: 'Can I join this weekend?',
        updatedAt: pendingNow
      },
      $setOnInsert: {
        _id: crypto.randomUUID(),
        organizerNote: null,
        cancelReason: null,
        cancelMessage: null,
        cancelledAt: null,
        selectedPackageIndex: null,
        reviewedAt: null,
        reviewedById: null,
        createdAt: pendingNow
      }
    },
    { upsert: true }
  );

  const nikeMerchantProfile = await upsertMerchantProfile([vendor._id], {
    shopName: 'Nike UAE',
    description: 'Performance footwear, hydration, and trail apparel for UAE runners.',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    contactEmail: 'nike-uae@uaetrails.app',
    contactPhone: '+971-50-1100221'
  });

  const adidasMerchantProfile = await upsertMerchantProfile([vendor._id], {
    shopName: 'Adidas GCC',
    description: 'Trail gear and expedition essentials curated for Gulf conditions.',
    logo: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=400',
    contactEmail: 'adidas-gcc@uaetrails.app',
    contactPhone: '+971-50-2200332'
  });

  const seedProducts = [
    {
      id: 'seed-product-nike-trail-running-shoes',
      merchantId: nikeMerchantProfile.id,
      name: 'Trail Running Shoes',
      description: 'Lightweight trail shoes with excellent grip for rocky terrain.',
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
      priceAed: 450,
      discountPercent: 10,
      category: 'footwear',
      status: ProductStatus.ACTIVE
    },
    {
      id: 'seed-product-adidas-ultralight-tent-2p',
      merchantId: adidasMerchantProfile.id,
      name: 'Ultralight Tent 2P',
      description: 'Two-person tent weighing only 1.5kg, perfect for desert camping.',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'],
      priceAed: 890,
      category: 'shelter',
      status: ProductStatus.ACTIVE
    },
    {
      id: 'seed-product-nike-hydration-pack-3l',
      merchantId: nikeMerchantProfile.id,
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
      id: 'seed-product-adidas-trekking-poles-pair',
      merchantId: adidasMerchantProfile.id,
      name: 'Trekking Poles (Pair)',
      description: 'Carbon fiber trekking poles, adjustable 65-135cm.',
      images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800'],
      priceAed: 320,
      category: 'gear',
      status: ProductStatus.ACTIVE
    },
    {
      id: 'seed-product-nike-headlamp-pro-800lm',
      merchantId: nikeMerchantProfile.id,
      name: 'Headlamp Pro 800lm',
      description: 'Rechargeable headlamp with 800 lumens, red light mode.',
      images: ['https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=800'],
      priceAed: 180,
      category: 'gear',
      status: ProductStatus.DRAFT
    }
  ];

  for (const product of seedProducts) {
    await upsertProduct(product.id, product.merchantId, product);
  }

  await seedMerchantAnalytics({
    products: seedProducts.map((product) => ({ id: product.id, priceAed: product.priceAed })),
    userIds: [vendor._id, visitor._id, guide._id, pendingVisitor._id]
  });

  await upsertReview({
    userId: visitor._id,
    targetType: ReviewTargetType.LOCATION,
    targetId: 'wadi-shawka-loop',
    rating: 5,
    comment: 'Beautiful wadi with easy access. Perfect for a morning hike with friends.'
  });

  await upsertReview({
    userId: visitor._id,
    targetType: ReviewTargetType.TENANT,
    targetId: tenant.id,
    rating: 5,
    comment: 'UAE Adventure Co runs well-organized trips with clear communication and safety briefings.'
  });

  await upsertReview({
    userId: guide._id,
    targetType: ReviewTargetType.LOCATION,
    targetId: 'jebel-jais-summit-trail',
    rating: 4,
    comment: 'Challenging but rewarding summit trail. Start early and bring layers for the summit.'
  });

  await upsertPost({
    id: 'seed-post-shawka-tips',
    category: PostCategory.TIPS,
    title: 'Best time to hike Wadi Shawka',
    content:
      'Early morning in winter is ideal — cooler temps and great light. Bring at least 2L of water per person.',
    images: [],
    locationId: 'wadi-shawka-loop',
    authorId: organizer._id
  });

  await upsertPostReply({
    id: 'seed-reply-shawka-1',
    postId: 'seed-post-shawka-tips',
    authorId: visitor._id,
    content:
      'Agreed — we went last January at 6am and it was perfect. Parking fills up by 8am on weekends.'
  });

  await upsertPost({
    id: 'seed-post-gear-question',
    category: PostCategory.QUESTIONS,
    title: 'What shoes for Jebel Jais?',
    content:
      'Planning my first summit hike — are trail runners enough or do I need proper hiking boots?',
    images: [],
    authorId: visitor._id
  });

  await upsertNotification({
    id: 'seed-notif-visitor-approved',
    userId: visitor._id,
    title: 'Join request approved',
    body: 'Your request to join a trip was approved. Check My Trips for details.',
    type: NotificationType.REQUEST_UPDATE,
    meta: { activityId: event._id }
  });

  const chatMessages = [
    {
      senderId: visitor._id,
      receiverId: organizer._id,
      content: 'Hi! I signed up for the Jebel Jais hike. What should I bring?',
      activityId: event._id
    },
    {
      senderId: organizer._id,
      receiverId: visitor._id,
      content:
        'Great to have you! Bring at least 2L of water, hiking shoes, and sun protection. We start early!',
      activityId: event._id
    },
    {
      senderId: visitor._id,
      receiverId: organizer._id,
      content: 'Perfect, thanks! Should I bring my own headlamp?',
      activityId: event._id
    },
    {
      senderId: organizer._id,
      receiverId: visitor._id,
      content: 'Yes, a headlamp is recommended since we start before sunrise. See you there!',
      activityId: event._id
    }
  ];

  await db().collection('chat_messages').deleteMany({
    $or: [
      { senderId: visitor._id, receiverId: organizer._id },
      { senderId: organizer._id, receiverId: visitor._id }
    ]
  });

  for (let i = 0; i < chatMessages.length; i++) {
    const msg = chatMessages[i];
    const createdAt = new Date();
    createdAt.setMinutes(createdAt.getMinutes() - (chatMessages.length - i) * 30);
    await db().collection('chat_messages').insertOne({
      _id: crypto.randomUUID(),
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      activityId: msg.activityId,
      createdAt,
      readAt: i < chatMessages.length - 1 ? createdAt : null
    });
  }

  const participant = await db().collection('activity_participants').findOne({
    activityId: event._id,
    userId: visitor._id
  });
  if (participant) {
    await db().collection('activity_participants').updateOne(
      { _id: participant._id },
      { $set: { checkedInAt: new Date() } }
    );
  }

  await seedReward(visitor._id, RewardAction.SIGNUP_WELCOME, 25, visitor._id, 'Welcome bonus');
  await seedReward(visitor._id, RewardAction.TRIP_ATTENDED, 30, `${event._id}:${visitor._id}`, 'Attended a trip');
  await seedReward(visitor._id, RewardAction.COMMUNITY_POST, 20, 'seed-post-1', 'Community post');
  await seedReward(organizer._id, RewardAction.ACTIVITY_PUBLISHED, 50, event._id, 'Published a trip');
  await seedReward(organizer._id, RewardAction.ACTIVITY_HOSTED, 75, event._id, 'Hosted a trip');

  await db().collection('auth_users').updateOne(
    { _id: organizer._id },
    { $set: { 'profile.membershipTier': MembershipTier.ACTIVE, updatedAt: new Date() } }
  );

  await createUserBadge({ userId: organizer._id, badgeKey: 'tier_active' });
  await createUserBadge({ userId: organizer._id, badgeKey: 'trip_leader' });

  console.log('Seed complete.');
  console.log(`Admin: admin@uaetrails.app / ${credentials.admin}`);
  console.log(`Organizer: organizer@uaetrails.app / ${credentials.organizer}`);
  console.log(`Guide: guide@uaetrails.app / ${credentials.guide}`);
  console.log(`Guide2 (tenant owner): guide2@uaetrails.app / ${credentials.guide2}`);
  console.log(`Visitor: visitor@uaetrails.app / ${credentials.visitor}`);
  console.log('Merchant Admin: vendor@uaetrails.app / Vendor@12345');
  console.log(`Pending Visitor: visitor2@uaetrails.app / ${credentials.pendingVisitor}`);
  console.log(`Suspended: suspended@uaetrails.app / ${credentials.suspended}`);
  console.log(`Tenant 1 (COMPANY): ${tenant.id} — ${tenant.slug}`);
  console.log(`Tenant 2 (GUIDE_OWNED): ${tenant2.id} — ${tenant2.slug}`);
  console.log(`Pending application: Hatta Hiking Club (by ${pendingVisitor.email})`);
  console.log(`Seeded by admin id: ${admin._id}`);
  console.log(`Merchant stores: ${nikeMerchantProfile.shopName}, ${adidasMerchantProfile.shopName} (${seedProducts.length} products)`);
  console.log(`Chat messages: ${chatMessages.length} seeded`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
  });
