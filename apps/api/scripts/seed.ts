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
  HostApplicationStatus,
  ProductStatus,
  RequestStatus,
  ReviewTargetType,
  TenantBusinessMode,
  TenantStatus,
  TenantType,
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
  buildActivityFromCreateInput,
  buildLocationFromCreateInput,
  type ActivityCreateInput,
  type LocationCreateInput
} from '../src/lib/entity-builders.js';
import { findActivityDocInMongo, findLocationInMongo, writeActivityDocToMongo, writeLocationToMongo } from '../src/lib/entity-sync.js';
import { getMongoClient, connectMongo, disconnectMongo } from '../src/lib/mongo.js';
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
import { DEMO_ACCOUNTS } from '../src/lib/demo-accounts.js';
import { createUserFavorite } from '../src/lib/favorites-store.js';
import { logOmarHostQaPlaybook } from './logOmarHostQaPlaybook.js';
import {
  createGroupWallMessage,
  createSocialGroup,
  ensureGroupMember,
  type GroupWallReactionKind,
} from '../src/lib/social-groups-store.js';
import { ensureActivityGroupChat } from '../src/services/activity-group-chat.js';
import { logConnectionsDemoPlaybook, seedConnectionsDemo } from './seedConnectionsDemo.js';

const seedChatThread = async (
  messages: Array<{
    senderId: string;
    receiverId: string;
    content: string;
    activityId?: string;
    unreadForReceiver?: boolean;
  }>
) => {
  if (messages.length === 0) return;

  const pairs = new Set<string>();
  for (const message of messages) {
    pairs.add([message.senderId, message.receiverId].sort().join(':'));
  }

  await db().collection('chat_messages').deleteMany({
    $or: [...pairs].flatMap((key) => {
      const [a, b] = key.split(':');
      return [
        { senderId: a, receiverId: b },
        { senderId: b, receiverId: a },
      ];
    }),
  });

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const createdAt = new Date();
    createdAt.setMinutes(createdAt.getMinutes() - (messages.length - i) * 45);
    const isLast = i === messages.length - 1;
    const receiverUnread = Boolean(message.unreadForReceiver && isLast);
    await db().collection('chat_messages').insertOne({
      _id: crypto.randomUUID(),
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      activityId: message.activityId ?? null,
      createdAt,
      readAt: receiverUnread ? null : createdAt,
    });
  }
};

const seedGroupWallReaction = async (input: {
  groupId: string;
  messageId: string;
  userId: string;
  kind: GroupWallReactionKind;
}) => {
  await db().collection('social_group_wall_reactions').updateOne(
    { groupId: input.groupId, messageId: input.messageId, userId: input.userId, kind: input.kind },
    {
      $setOnInsert: {
        _id: crypto.randomUUID(),
        groupId: input.groupId,
        messageId: input.messageId,
        userId: input.userId,
        kind: input.kind,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
};

const resetDemoFriendsGroup = async (participantId: string) => {
  const existing = await db()
    .collection('social_groups')
    .find({ adminUserId: participantId, name: 'Weekend Hikers UAE', type: 'friends' })
    .toArray();
  for (const group of existing) {
    await db().collection('social_group_wall_reactions').deleteMany({ groupId: group._id });
    await db().collection('social_group_wall').deleteMany({ groupId: group._id });
    await db().collection('social_group_members').deleteMany({ groupId: group._id });
    await db().collection('social_groups').deleteOne({ _id: group._id });
  }
};

const clearGroupWall = async (groupId: string) => {
  await db().collection('social_group_wall_reactions').deleteMany({ groupId });
  await db().collection('social_group_wall').deleteMany({ groupId });
};

const seedMobileInboxDemo = async (input: {
  participantId: string;
  agencyOwnerId: string;
  agencyGuideId: string;
  individualHostId: string;
  jaisActivityId: string;
  fossilCampActivityId: string;
  shawkaActivityId: string;
}) => {
  await seedParticipant(input.shawkaActivityId, input.participantId, input.agencyOwnerId);

  await db().collection('activity_requests').updateOne(
    { activityId: input.fossilCampActivityId, userId: input.participantId },
    {
      $set: {
        status: RequestStatus.PENDING,
        note: 'Happy to bring my own tent — any tips for first-timers?',
        updatedAt: new Date(),
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
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  await seedChatThread([
    {
      senderId: input.participantId,
      receiverId: input.agencyGuideId,
      content: 'Still looking for a Hatta crew this Friday — are you around?',
    },
    {
      senderId: input.agencyGuideId,
      receiverId: input.participantId,
      content: 'Yes! Wadi Shawka loop is on — join the free hike on the map if you want in.',
    },
    {
      senderId: input.participantId,
      receiverId: input.agencyGuideId,
      content: 'Perfect — I can do an early start. Anything I should pack besides water?',
    },
    {
      senderId: input.agencyGuideId,
      receiverId: input.participantId,
      content: 'Trail shoes, light layer, and snacks 🥾 Sun is up fast after 7.',
      unreadForReceiver: true,
    },
    {
      senderId: input.participantId,
      receiverId: input.individualHostId,
      content: 'Hey — is Fossil Rock camp beginner-friendly? First desert overnight for me.',
      activityId: input.fossilCampActivityId,
    },
    {
      senderId: input.individualHostId,
      receiverId: input.participantId,
      content: 'Totally — we go over setup together. Request a spot and I will approve you in the group chat.',
      activityId: input.fossilCampActivityId,
    },
    {
      senderId: input.participantId,
      receiverId: input.individualHostId,
      content: 'Amazing, just sent the request. Can I borrow a mat if mine is too thin?',
      activityId: input.fossilCampActivityId,
    },
    {
      senderId: input.individualHostId,
      receiverId: input.participantId,
      content: 'Mats are fine — we have a few spares in the SUV if you need one.',
      activityId: input.fossilCampActivityId,
      unreadForReceiver: true,
    },
    {
      senderId: input.participantId,
      receiverId: input.agencyOwnerId,
      content: 'Hi Khalid — quick question on the Jebel Jais meet point tomorrow.',
      activityId: input.jaisActivityId,
    },
    {
      senderId: input.agencyOwnerId,
      receiverId: input.participantId,
      content:
        'Great to have you! Bring at least 2L of water, hiking shoes, and sun protection. We start early!',
      activityId: input.jaisActivityId,
    },
    {
      senderId: input.participantId,
      receiverId: input.agencyOwnerId,
      content: 'Perfect, thanks! Should I bring my own headlamp?',
      activityId: input.jaisActivityId,
    },
    {
      senderId: input.agencyOwnerId,
      receiverId: input.participantId,
      content: 'Yes, a headlamp is recommended since we start before sunrise. See you there! 🌄',
      activityId: input.jaisActivityId,
      unreadForReceiver: true,
    },
  ]);

  await resetDemoFriendsGroup(input.participantId);

  const friendsGroup = await createSocialGroup({
    creatorUserId: input.participantId,
    type: 'friends',
    name: 'Weekend Hikers UAE',
    slogan: 'Hatta · Shawka · early starts',
  });
  await ensureGroupMember({
    groupId: friendsGroup.id,
    userId: input.agencyGuideId,
    role: 'buddy',
    createdByUserId: input.participantId,
  });

  const groupWallPosts = [
    { authorUserId: input.participantId, body: 'Who is in for a 5:30am meet at Hatta Dam this Saturday?' },
    { authorUserId: input.agencyGuideId, body: 'I am — bringing an extra headlamp for whoever needs one 🔦' },
    { authorUserId: input.agencyGuideId, body: 'Forecast looks clear. Pack 2L water minimum.' },
    { authorUserId: input.participantId, body: 'Reply here if you want a rideshare from Dubai Marina 🚗' },
  ];
  const friendsWallIds: string[] = [];
  for (const post of groupWallPosts) {
    const created = await createGroupWallMessage({
      groupId: friendsGroup.id,
      authorUserId: post.authorUserId,
      body: post.body,
    });
    friendsWallIds.push(created.id);
  }

  if (friendsWallIds[1]) {
    await seedGroupWallReaction({
      groupId: friendsGroup.id,
      messageId: friendsWallIds[1],
      userId: input.participantId,
      kind: 'heart',
    });
    await seedGroupWallReaction({
      groupId: friendsGroup.id,
      messageId: friendsWallIds[1],
      userId: input.participantId,
      kind: 'like',
    });
  }
  if (friendsWallIds[2]) {
    await seedGroupWallReaction({
      groupId: friendsGroup.id,
      messageId: friendsWallIds[2],
      userId: input.participantId,
      kind: 'mountain',
    });
    await seedGroupWallReaction({
      groupId: friendsGroup.id,
      messageId: friendsWallIds[2],
      userId: input.agencyGuideId,
      kind: 'happy',
    });
    await seedGroupWallReaction({
      groupId: friendsGroup.id,
      messageId: friendsWallIds[2],
      userId: input.agencyOwnerId,
      kind: 'laugh',
    });
  }

  const jaisGroupId = await ensureActivityGroupChat(input.jaisActivityId);
  if (jaisGroupId) {
    await clearGroupWall(jaisGroupId);
    const outingPosts = [
      {
        authorUserId: input.agencyOwnerId,
        body: 'Meet at Jebel Jais base parking at 5:45 AM — look for the UAE Adventure flag.',
      },
      {
        authorUserId: input.participantId,
        body: 'Got it. Bringing 2L water and a headlamp ⛰️',
      },
      {
        authorUserId: input.agencyOwnerId,
        body: 'Perfect. Weather looks clear — dress warm for the summit.',
      },
      {
        authorUserId: input.agencyGuideId,
        body: 'I will bring the first-aid kit and spare poles for anyone who needs them.',
      },
    ];
    const outingWallIds: string[] = [];
    for (const post of outingPosts) {
      const created = await createGroupWallMessage({
        groupId: jaisGroupId,
        authorUserId: post.authorUserId,
        body: post.body,
      });
      outingWallIds.push(created.id);
    }

    if (outingWallIds[1]) {
      await seedGroupWallReaction({
        groupId: jaisGroupId,
        messageId: outingWallIds[1],
        userId: input.agencyOwnerId,
        kind: 'like',
      });
      await seedGroupWallReaction({
        groupId: jaisGroupId,
        messageId: outingWallIds[1],
        userId: input.agencyGuideId,
        kind: 'heart',
      });
    }
    if (outingWallIds[2]) {
      await seedGroupWallReaction({
        groupId: jaisGroupId,
        messageId: outingWallIds[2],
        userId: input.participantId,
        kind: 'camping',
      });
    }
  }
};

const db = () => getMongoClient()!.db();

const demoAccount = (email: keyof typeof DEMO_ACCOUNTS) => DEMO_ACCOUNTS[email];

const upsertDemoUser = (email: keyof typeof DEMO_ACCOUNTS) => {
  const { password, role, displayName } = DEMO_ACCOUNTS[email];
  return upsertUser({ email, password, role, displayName });
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
  businessMode?: TenantRecord['businessMode'];
  description?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  services?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  region?: string | null;
}): Promise<TenantRecord> => {
  const existing = await findTenantBySlug(input.slug);
  if (existing) {
    const updated: TenantRecord = {
      ...existing,
      name: input.name,
      type: input.type,
      businessMode: input.businessMode ?? null,
      status: input.status,
      ownerId: input.ownerId,
      description: input.description ?? existing.description ?? null,
      website: input.website ?? existing.website ?? null,
      logoUrl: input.logoUrl ?? existing.logoUrl ?? null,
      services: input.services ?? existing.services ?? null,
      latitude: input.latitude ?? existing.latitude ?? null,
      longitude: input.longitude ?? existing.longitude ?? null,
      region: input.region ?? existing.region ?? null,
      updatedAt: new Date()
    };
    await writeTenantToMongo(updated);
    return updated;
  }

  const created = await createTenantRecord({
    id: input.id,
    name: input.name,
    slug: input.slug,
    type: input.type,
    status: input.status,
    ownerId: input.ownerId
  });
  const enriched: TenantRecord = {
    ...created,
    businessMode: input.businessMode ?? null,
    description: input.description ?? null,
    website: input.website ?? null,
    logoUrl: input.logoUrl ?? null,
    services: input.services ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    region: input.region ?? null,
    updatedAt: new Date()
  };
  await writeTenantToMongo(enriched);
  return enriched;
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

const upsertEvent = async (id: string, data: ActivityCreateInput) => {
  const doc = buildActivityFromCreateInput(data, id);
  const existing = await findActivityDocInMongo(id);
  if (existing) {
    doc.createdAt = existing.createdAt;
  }
  await writeActivityDocToMongo(doc);
  return doc;
};

const upsertHostApplication = async (input: {
  id: string;
  applicantId: string;
  requestedTenantId?: string | null;
  requestedName: string;
  requestedSlug: string;
  requestedType: TenantRecord['type'];
  status?: HostApplicationStatus;
  metadata?: unknown;
}) => {
  const now = new Date();
  await db().collection('host_applications').updateOne(
    { _id: input.id },
    {
      $set: {
        applicantId: input.applicantId,
        requestedTenantId: input.requestedTenantId ?? null,
        requestedName: input.requestedName,
        requestedSlug: input.requestedSlug,
        requestedType: input.requestedType,
        status: input.status ?? HostApplicationStatus.PENDING,
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
    latitude?: number | null;
    longitude?: number | null;
    region?: string | null;
  },
  options?: { tenantId?: string | null; linkShopTenant?: boolean }
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
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          region: data.region ?? null,
          updatedAt: now
        }
      }
    );
    return (await findManagedMerchantProfileById(adminIds[0]!, existing._id as string))!;
  }

  const created = await createMerchantProfileForUser(adminIds[0]!, data, options);
  await db().collection('merchant_profiles').updateOne(
    { _id: created.id },
    {
      $set: {
        adminIds,
        logo: data.logo ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        region: data.region ?? null,
        updatedAt: new Date()
      }
    }
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

const seedDemandId = (label: string): string => `seed-${label}`;

const seedMerchantAnalytics = async (input: {
  products: Array<{ id: string; priceAed: number }>;
  userIds: string[];
}) => {
  await db().collection('product_clicks').deleteMany({ productId: { $in: input.products.map((product) => product.id) } });
  await db().collection('shop_orders').deleteMany({
    'items.productId': { $in: input.products.map((product) => product.id) },
  });

  const now = new Date();
  const clickDocs: Array<{ _id: string; productId: string; timestamp: Date; userId: string }> = [];
  const orderDocs: Array<{
    _id: string;
    userId: string;
    status: string;
    totalAed: number;
    stripeSessionId: string | null;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPriceAed: number;
      totalAed: number;
      status: string;
      fulfillmentTrackingLink: string | null;
      timestamp: Date;
    }>;
  }> = [];

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
        const lineTimestamp = new Date(timestamp.getTime() + orderIndex * 90_000);
        const orderId = crypto.randomUUID();
        const totalAed = quantity * product.priceAed;
        orderDocs.push({
          _id: orderId,
          userId: input.userIds[crypto.randomInt(0, input.userIds.length)]!,
          status: 'PAID',
          totalAed,
          stripeSessionId: null,
          createdAt: lineTimestamp,
          updatedAt: lineTimestamp,
          items: [
            {
              id: `${orderId}:0`,
              productId: product.id,
              quantity,
              unitPriceAed: product.priceAed,
              totalAed,
              status: 'PENDING',
              fulfillmentTrackingLink: null,
              timestamp: lineTimestamp,
            },
          ],
        });
      }
    }
  }

  if (clickDocs.length > 0) {
    await db().collection('product_clicks').insertMany(clickDocs);
  }
  if (orderDocs.length > 0) {
    await db().collection('shop_orders').insertMany(orderDocs);
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

const isMobileInboxSeedEnabled = (): boolean => {
  const value = String(process.env.SEED_MOBILE_INBOX ?? '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
};

const isSeedConnectionsEnabled = (): boolean => {
  const value = String(process.env.SEED_CONNECTIONS ?? '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
};

const runConnectionsDemoSeed = async (): Promise<boolean> => {
  const participant = await findAuthUserByEmail('visitor@uaetrails.app');
  const visitor2 = await findAuthUserByEmail('visitor2@uaetrails.app');
  const guide = await findAuthUserByEmail('guide@uaetrails.app');
  const host = await findAuthUserByEmail('host@uaetrails.app');
  const organizer = await findAuthUserByEmail('organizer@uaetrails.app');
  const shop = await findAuthUserByEmail('shop@uaetrails.app');

  if (!participant || !visitor2 || !guide || !host || !organizer || !shop) {
    console.warn('[seed] SEED_CONNECTIONS skipped — run full seed first (missing demo users)');
    return false;
  }

  await seedConnectionsDemo({
    visitorId: participant._id,
    visitor2Id: visitor2._id,
    guideId: guide._id,
    hostId: host._id,
    organizerId: organizer._id,
    shopOwnerId: shop._id,
  });
  logConnectionsDemoPlaybook();
  return true;
};

const runMobileInboxDemoSeed = async (): Promise<boolean> => {
  const participant = await findAuthUserByEmail('visitor@uaetrails.app');
  const agencyOwner = await findAuthUserByEmail('organizer@uaetrails.app');
  const agencyGuide = await findAuthUserByEmail('guide@uaetrails.app');
  const individualHost = await findAuthUserByEmail('host@uaetrails.app');
  const jaisEvent = await findActivityDocInMongo(SEED_MARKER_EVENT_ID);

  if (!participant || !agencyOwner || !agencyGuide || !individualHost || !jaisEvent) {
    console.warn(
      '[seed] SEED_MOBILE_INBOX skipped — run full seed first (missing demo users or Jebel Jais activity)'
    );
    return false;
  }

  await seedMobileInboxDemo({
    participantId: participant._id,
    agencyOwnerId: agencyOwner._id,
    agencyGuideId: agencyGuide._id,
    individualHostId: individualHost._id,
    jaisActivityId: jaisEvent._id,
    fossilCampActivityId: 'seed-event-fossil-camp',
    shawkaActivityId: 'seed-event-shawka-free',
  });

  console.log('[seed] Mobile inbox demo seeded for visitor@uaetrails.app');
  console.log(
    'Inbox demo: DMs (Fatima, Omar, Khalid), friends wall + emoji reactions, Jebel Jais outing chat + reactions'
  );
  return true;
};

const hasExistingSeedData = async (): Promise<boolean> => {
  const existingAdmin = await findAuthUserByEmail(SEED_MARKER_EMAIL);
  if (existingAdmin) return true;

  const existingEvent = await findActivityDocInMongo(SEED_MARKER_EVENT_ID);
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
    if (isMobileInboxSeedEnabled()) {
      await runMobileInboxDemoSeed();
    }
    if (isSeedConnectionsEnabled()) {
      await runConnectionsDemoSeed();
    }
    return;
  }

  const admin = await upsertDemoUser('admin@uaetrails.app');
  await updateAuthUserProfile(admin._id, { platformMasterAdmin: true });

  const participant = await upsertDemoUser('visitor@uaetrails.app');

  const agencyOwner = await upsertDemoUser('organizer@uaetrails.app');

  const agencyGuide = await upsertDemoUser('guide@uaetrails.app');

  const individualHost = await upsertDemoUser('host@uaetrails.app');

  const shopOwner = await upsertDemoUser('shop@uaetrails.app');

  const pendingParticipant = await upsertDemoUser('visitor2@uaetrails.app');

  const suspendedDemo = demoAccount('suspended@uaetrails.app');
  const suspendedHash = await bcrypt.hash(suspendedDemo.password, 10);
  const suspendedExisting = await findAuthUserByEmail('suspended@uaetrails.app');
  if (suspendedExisting) {
    await updateAuthUserCore({
      userId: suspendedExisting._id,
      status: UserStatus.SUSPENDED
    });
    await updateAuthUserProfile(suspendedExisting._id, { displayName: suspendedDemo.displayName });
  } else {
    await createAuthUser({
      email: 'suspended@uaetrails.app',
      passwordHash: suspendedHash,
      googleId: null,
      authProvider: AuthProvider.EMAIL,
      role: suspendedDemo.role,
      status: UserStatus.SUSPENDED,
      emailVerifiedAt: new Date(),
      referralCode: 'SUSP01',
      profile: { displayName: suspendedDemo.displayName, phone: null, bio: null, avatarUrl: null }
    });
  }

  await Promise.all([
    setDemoAvatar(participant._id, 'participant'),
    setDemoAvatar(agencyOwner._id, 'agency-owner'),
    setDemoAvatar(agencyGuide._id, 'agency-guide'),
    setDemoAvatar(individualHost._id, 'individual-host'),
    setDemoAvatar(shopOwner._id, 'shop-owner'),
    setDemoAvatar(pendingParticipant._id, 'pending-participant'),
    setDemoAvatar(admin._id, 'admin')
  ]);

  await updateAuthUserProfile(participant._id, {
    bio: 'Weekend hiker exploring Hatta, Wadi Shawka, and Dubai trail groups.',
    phone: '+971508887766',
    dateOfBirth: '1992-03-10',
    gender: 'female',
    countryCode: 'AE',
    city: 'dubai',
    languages: 'English, Hindi',
  });

  await updateAuthUserProfile(pendingParticipant._id, {
    bio: 'Applying to host group hikes around Hatta — love early-morning desert routes.',
    phone: '+971507654321'
  });

  await updateAuthUserProfile(agencyGuide._id, {
    bio: 'Certified mountain guide — Jebel Jais, Wadi Shawka, and family-friendly dam loops.',
    phone: '+971502223344'
  });

  const agencyTenant = await upsertTenant({
    id: 'tenant-uae-adventure',
    name: 'UAE Adventure Co',
    slug: 'uae-adventure-co',
    type: TenantType.COMPANY,
    businessMode: TenantBusinessMode.AGENCY,
    status: TenantStatus.ACTIVE,
    ownerId: agencyOwner._id,
    description:
      'Licensed tour agency for guided hiking, camping, and corporate outdoor programs across the UAE.',
    logoUrl: demoAvatar('uae-adventure-co'),
    services: 'Guided hikes, desert camping, corporate retreats, mountain safety courses',
    latitude: 24.4539,
    longitude: 54.3773,
    region: 'Abu Dhabi'
  });

  await upsertTenantMembership({
    tenantId: agencyTenant.id,
    userId: agencyOwner._id,
    role: MembershipRole.TENANT_OWNER
  });

  await upsertTenantMembership({
    tenantId: agencyTenant.id,
    userId: agencyGuide._id,
    role: MembershipRole.TENANT_GUIDE
  });

  await updateAuthUserProfile(agencyOwner._id, {
    bio: 'UAE-based tour agency specializing in guided hiking and camping across the Emirates. Safety-first activities with small groups and experienced local guides.',
    phone: '+971501234567'
  });

  await upsertHostApplication({
    id: 'seed-app-uae-adventure',
    applicantId: agencyOwner._id,
    requestedTenantId: agencyTenant.id,
    requestedName: agencyTenant.name,
    requestedSlug: agencyTenant.slug,
    requestedType: TenantType.COMPANY,
    status: HostApplicationStatus.APPROVED,
    metadata: {
      hostProfileType: 'agency',
      hostDisplayName: 'Khalid Rahman',
      requestedName: agencyTenant.name,
      bio: 'Licensed tour agency for guided outdoor experiences across the UAE.',
      phone: '+971501234567',
      phoneE164: '+971501234567',
      services: agencyTenant.services,
      latitude: agencyTenant.latitude,
      longitude: agencyTenant.longitude,
      region: agencyTenant.region,
      profilePhoto: demoAvatar('uae-adventure-co'),
      nationality: 'UAE',
      residence: 'Abu Dhabi',
      experience: '5+ years',
      languages: 'English, Arabic',
      certificates: 'Wilderness First Aid, UAE Mountain Guide certification',
      notableHikes: 'Jebel Jais summit routes, Wadi Shawka loop, Hatta dam trails'
    }
  });

  const individualHostTenant = await upsertTenant({
    id: 'tenant-desert-explorer',
    name: 'Desert Explorer',
    slug: 'desert-explorer',
    type: TenantType.GUIDE_OWNED,
    status: TenantStatus.ACTIVE,
    ownerId: individualHost._id,
    description: 'Independent guide hosting free and shared-cost hikes and desert meetups.',
    logoUrl: demoAvatar('desert-explorer'),
    latitude: 25.22,
    longitude: 55.85,
    region: 'Sharjah'
  });

  await upsertTenantMembership({
    tenantId: individualHostTenant.id,
    userId: individualHost._id,
    role: MembershipRole.TENANT_OWNER
  });

  await updateAuthUserProfile(individualHost._id, {
    bio: 'Weekend hiking host based in Sharjah. I lead small free groups to Fossil Rock, Wadi Shawka, and nearby trails.',
    phone: '+971509876543',
    dateOfBirth: '1995-06-15',
    gender: 'male',
    city: 'sharjah',
  });

  await upsertHostApplication({
    id: 'seed-app-desert-explorer',
    applicantId: individualHost._id,
    requestedTenantId: individualHostTenant.id,
    requestedName: individualHostTenant.name,
    requestedSlug: individualHostTenant.slug,
    requestedType: TenantType.GUIDE_OWNED,
    status: HostApplicationStatus.APPROVED,
    metadata: {
      hostProfileType: 'individual',
      hostDisplayName: 'Omar Al Hosani',
      bio: 'Weekend hiking host based in Sharjah. I lead small free groups to Fossil Rock, Wadi Shawka, and nearby trails.',
      phone: '+971509876543',
      phoneE164: '+971509876543',
      nationality: 'UAE',
      residence: 'Sharjah',
      languages: 'English, Arabic, Hindi',
      interests: 'Hiking, camping, photography, community building'
    }
  });

  const shopTenant = await upsertTenant({
    id: 'tenant-desert-trail-shop',
    name: 'Desert Trail Outfitters',
    slug: 'desert-trail-outfitters',
    type: TenantType.COMPANY,
    businessMode: TenantBusinessMode.SHOP,
    status: TenantStatus.ACTIVE,
    ownerId: shopOwner._id,
    description: 'Trail running shoes, hydration packs, and camping essentials for UAE outdoor conditions.',
    logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    latitude: 25.1972,
    longitude: 55.2744,
    region: 'Dubai'
  });

  await upsertTenantMembership({
    tenantId: shopTenant.id,
    userId: shopOwner._id,
    role: MembershipRole.TENANT_OWNER
  });

  await updateAuthUserProfile(shopOwner._id, {
    bio: 'Outdoor gear shop on the map — trail shoes, tents, and hydration for UAE hikers and campers.',
    phone: '+971501100221',
    dateOfBirth: '1988-11-20',
    gender: 'female',
    countryCode: 'AE',
    city: 'dubai',
    languages: 'English, Malayalam',
  });

  await upsertHostApplication({
    id: 'seed-app-desert-trail-shop',
    applicantId: shopOwner._id,
    requestedTenantId: shopTenant.id,
    requestedName: shopTenant.name,
    requestedSlug: shopTenant.slug,
    requestedType: TenantType.COMPANY,
    status: HostApplicationStatus.APPROVED,
    metadata: {
      hostProfileType: 'shop',
      hostDisplayName: 'Priya Sharma',
      requestedName: shopTenant.name,
      bio: shopTenant.description,
      phone: '+971501100221',
      phoneE164: '+971501100221',
      profilePhoto: shopTenant.logoUrl,
      latitude: shopTenant.latitude,
      longitude: shopTenant.longitude,
      region: shopTenant.region
    }
  });

  await upsertHostApplication({
    id: 'seed-app-pending',
    applicantId: pendingParticipant._id,
    requestedName: 'Hatta Hiking Club',
    requestedSlug: 'hatta-hiking-club',
    requestedType: TenantType.COMPANY,
    status: HostApplicationStatus.PENDING,
    metadata: {
      hostProfileType: 'agency',
      hostDisplayName: 'Maya Hassan',
      requestedName: 'Hatta Hiking Club',
      bio: 'Community hiking club applying to host group activities around Hatta.',
      phone: '+971507654321',
      phoneE164: '+971507654321',
      nationality: 'UAE',
      residence: 'Dubai',
      languages: 'English, Urdu',
      services: 'Weekend group hikes around Hatta and Dubai outskirts'
    }
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
        tags: [
          'wadi',
          'family',
          'pools',
          'facility:Toilet at dam car park',
          'nearby:Fuel & shop ~10 km toward Kalba (plan a stop)',
        ],
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

  const event =   await upsertEvent('seed-event-jais', {
    tenant: { connect: { id: agencyTenant.id } },
    location: { connect: { id: 'jebel-jais-summit-trail' } },
    createdBy: { connect: { id: agencyOwner._id } },
    host: { connect: { id: agencyGuide._id } },
    activityType: ActivityType.HIKING,
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
    requirements: ['Water 2L', 'Hiking shoes', 'Cap and sunscreen'],
    outingCategory: 'hiking',
  });

  const start2 = new Date();
  start2.setDate(start2.getDate() + 14);
  start2.setHours(16, 0, 0, 0);

  await upsertEvent('seed-event-fossil-camp', {
    tenant: { connect: { id: individualHostTenant.id } },
    location: { connect: { id: 'fossil-rock-desert-camp' } },
    createdBy: { connect: { id: individualHost._id } },
    host: { connect: { id: individualHost._id } },
    activityType: ActivityType.CAMPING,
    title: 'Fossil Rock Overnight Camp',
    description: 'Desert camping with stargazing and sunrise photography.',
    startAt: start2,
    meetingPoint: 'Sharjah Desert Road (coordinates shared upon booking)',
    meetingLat: 25.2185,
    meetingLng: 55.8521,
    priceAed: 200,
    capacity: 12,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: [
      'Arrive by 4 PM',
      'Set up camp',
      'Sunset BBQ',
      'Stargazing session',
      'Sunrise photography'
    ],
    requirements: ['Sleeping bag', 'Warm jacket', 'Camera (optional)', 'Water 3L'],
    outingCategory: 'camping',
  });

  const freeHikeStart = new Date();
  freeHikeStart.setDate(freeHikeStart.getDate() + 10);
  freeHikeStart.setHours(7, 0, 0, 0);

  await upsertEvent('seed-event-shawka-free', {
    tenant: { connect: { id: agencyTenant.id } },
    location: { connect: { id: 'wadi-shawka-loop' } },
    createdBy: { connect: { id: agencyOwner._id } },
    host: { connect: { id: agencyGuide._id } },
    activityType: ActivityType.HIKING,
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
    requirements: ['Water 1.5L', 'Trail shoes', 'Sun protection'],
    outingCategory: 'hiking',
  });

  const freeCampStart = new Date();
  freeCampStart.setDate(freeCampStart.getDate() + 21);
  freeCampStart.setHours(15, 0, 0, 0);

  const omarDraftStart = new Date();
  omarDraftStart.setDate(omarDraftStart.getDate() + 30);
  omarDraftStart.setHours(9, 0, 0, 0);

  await upsertEvent('seed-event-omar-draft', {
    tenant: { connect: { id: individualHostTenant.id } },
    location: { connect: { id: 'fossil-rock-desert-camp' } },
    createdBy: { connect: { id: individualHost._id } },
    host: { connect: { id: individualHost._id } },
    activityType: ActivityType.HIKING,
    title: 'Omar — Wadi loop (draft)',
    description: 'Draft plan for host QA — publish from Trips when ready.',
    startAt: omarDraftStart,
    meetingPoint: 'Sharjah — exact pin after publish',
    meetingLat: 25.22,
    meetingLng: 55.85,
    priceAed: 0,
    capacity: 8,
    status: ActivityStatus.DRAFT,
    itinerary: ['Draft — edit before publish'],
    requirements: ['Water'],
    outingCategory: 'hiking',
  });

  await upsertEvent('seed-event-desert-meetup', {
    tenant: { connect: { id: individualHostTenant.id } },
    location: { connect: { id: 'fossil-rock-desert-camp' } },
    createdBy: { connect: { id: individualHost._id } },
    host: { connect: { id: individualHost._id } },
    activityType: ActivityType.EVENT,
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
    requirements: ['Chair or mat', 'Warm layer', 'Snacks & water'],
    outingCategory: 'events',
    participationMode: 'rsvp',
  });

  const eventRunStart = new Date();
  eventRunStart.setDate(eventRunStart.getDate() + 5);
  eventRunStart.setHours(6, 30, 0, 0);

  await upsertEvent('seed-event-kite-beach-run', {
    tenant: { connect: { id: agencyTenant.id } },
    location: { connect: { id: 'hatta-dam-loop' } },
    createdBy: { connect: { id: agencyOwner._id } },
    host: { connect: { id: agencyGuide._id } },
    activityType: ActivityType.EVENT,
    title: 'Kite Beach Sunrise Run',
    description: 'Community 5K along the Dubai Marina/Kite Beach track — all paces welcome.',
    startAt: eventRunStart,
    meetingPoint: 'Kite Beach running track',
    meetingLat: 25.1654,
    meetingLng: 55.2553,
    priceAed: 0,
    capacity: 30,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Warm-up 6:30 AM', '5K out-and-back', 'Stretch & coffee'],
    requirements: ['Running shoes', 'Water bottle', 'High-vis top'],
    outingCategory: 'events',
    participationMode: 'rsvp',
  });

  const carpoolStart = new Date();
  carpoolStart.setDate(carpoolStart.getDate() + 4);
  carpoolStart.setHours(5, 0, 0, 0);

  await upsertEvent('seed-event-rideshare-marina-jais', {
    tenant: { connect: { id: individualHostTenant.id } },
    location: { connect: { id: 'jebel-jais-summit-trail' } },
    createdBy: { connect: { id: individualHost._id } },
    host: { connect: { id: individualHost._id } },
    activityType: ActivityType.RIDESHARE,
    title: 'Rideshare Dubai Marina → Jebel Jais',
    description: 'Shared ride for the Jebel Jais hike — split fuel costs.',
    startAt: carpoolStart,
    meetingPoint: 'Dubai Marina Mall parking',
    meetingLat: 25.0782,
    meetingLng: 55.1394,
    startPoint: 'Jebel Jais Viewing Deck',
    startLat: 25.9433,
    startLng: 56.1422,
    pricingMode: 'shared',
    rideshareFree: false,
    ridesharePriceAed: 35,
    priceAed: 35,
    capacity: 4,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Depart Marina 5:00 AM', 'Arrive Jebel Jais ~7:00 AM'],
    requirements: ['Be on time', 'Share fuel cost at pickup', 'Max 1 bag per seat'],
    outingCategory: 'rideshare',
  });

  const boulderStart = new Date();
  boulderStart.setDate(boulderStart.getDate() + 9);
  boulderStart.setHours(17, 0, 0, 0);

  await upsertEvent('seed-event-boulder-session', {
    tenant: { connect: { id: agencyTenant.id } },
    location: { connect: { id: 'hatta-dam-loop' } },
    createdBy: { connect: { id: agencyOwner._id } },
    host: { connect: { id: agencyGuide._id } },
    activityType: ActivityType.EVENT,
    outingCategory: 'activities',
    outingTopic: 'climbing',
    title: 'Evening boulder session (Hatta)',
    description: 'Outdoor bouldering meetup — all levels welcome; crash pads shared.',
    startAt: boulderStart,
    meetingPoint: 'Hatta Wadi Hub parking',
    meetingLat: 24.82,
    meetingLng: 56.13,
    priceAed: 0,
    capacity: 10,
    featured: true,
    status: ActivityStatus.PUBLISHED,
    publishedAt: new Date(),
    itinerary: ['Meet 5 PM', 'Warm-up problems', 'Wrap by 8 PM'],
    requirements: ['Activity type: Climb', 'Climbing shoes', 'Water'],
    participationMode: 'approval',
  });

  await seedParticipant(event._id, participant._id, agencyOwner._id);

  const approvedRequest = await db().collection('activity_requests').findOne({
    activityId: event._id,
    userId: participant._id
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

  await seedParticipant(event._id, agencyGuide._id, agencyOwner._id);
  await seedParticipant(event._id, admin._id, agencyOwner._id);

  const pendingNow = new Date();
  await db().collection('activity_requests').updateOne(
    { activityId: event._id, userId: pendingParticipant._id },
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

  const nikeMerchantProfile = await upsertMerchantProfile(
    [shopOwner._id],
    {
      shopName: 'Desert Trail Outfitters — Marina',
      description: 'Performance footwear, hydration, and trail apparel for UAE runners.',
      logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      contactEmail: 'nike-uae@uaetrails.app',
      contactPhone: '+971-50-1100221',
      latitude: 25.1972,
      longitude: 55.2744,
      region: 'Dubai',
    },
    { tenantId: shopTenant.id }
  );

  const adidasMerchantProfile = await upsertMerchantProfile(
    [shopOwner._id],
    {
      shopName: 'Desert Trail Outfitters — Abu Dhabi',
      description: 'Trail gear and expedition essentials curated for Gulf conditions.',
      logo: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=400',
      contactEmail: 'adidas-gcc@uaetrails.app',
      contactPhone: '+971-50-2200332',
      latitude: 24.4539,
      longitude: 54.3773,
      region: 'Abu Dhabi',
    },
    { linkShopTenant: false }
  );

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
    userIds: [shopOwner._id, participant._id, agencyGuide._id, pendingParticipant._id]
  });

  await upsertReview({
    userId: participant._id,
    targetType: ReviewTargetType.LOCATION,
    targetId: 'wadi-shawka-loop',
    rating: 5,
    comment: 'Beautiful wadi with easy access. Perfect for a morning hike with friends.'
  });

  await upsertReview({
    userId: participant._id,
    targetType: ReviewTargetType.TENANT,
    targetId: agencyTenant.id,
    rating: 5,
    comment: 'UAE Adventure Co runs well-organized activities with clear communication and safety briefings.'
  });

  await upsertReview({
    userId: agencyGuide._id,
    targetType: ReviewTargetType.LOCATION,
    targetId: 'jebel-jais-summit-trail',
    rating: 4,
    comment: 'Challenging but rewarding summit trail. Start early and bring layers for the summit.'
  });

  await upsertNotification({
    id: 'seed-notif-visitor-approved',
    userId: participant._id,
    title: 'Join request approved',
    body: 'Your request to join an activity was approved. Check My activities for details.',
    type: NotificationType.REQUEST_UPDATE,
    meta: { activityId: event._id }
  });

  await seedMobileInboxDemo({
    participantId: participant._id,
    agencyOwnerId: agencyOwner._id,
    agencyGuideId: agencyGuide._id,
    individualHostId: individualHost._id,
    jaisActivityId: event._id,
    fossilCampActivityId: 'seed-event-fossil-camp',
    shawkaActivityId: 'seed-event-shawka-free',
  });

  await seedParticipant('seed-event-desert-meetup', pendingParticipant._id, individualHost._id);

  await createUserFavorite({
    userId: participant._id,
    locationId: 'fossil-rock-desert-camp',
  });
  await createUserFavorite({
    userId: participant._id,
    activityId: 'seed-event-fossil-camp',
  });

  await seedConnectionsDemo({
    visitorId: participant._id,
    visitor2Id: pendingParticipant._id,
    guideId: agencyGuide._id,
    hostId: individualHost._id,
    organizerId: agencyOwner._id,
    shopOwnerId: shopOwner._id,
  });
  logConnectionsDemoPlaybook();
  logOmarHostQaPlaybook();

  const participantRecord = await db().collection('activity_participants').findOne({
    activityId: event._id,
    userId: participant._id
  });
  if (participantRecord) {
    await db().collection('activity_participants').updateOne(
      { _id: participantRecord._id },
      { $set: { checkedInAt: new Date() } }
    );
  }

  const suspendLegacyDemoUser = async (email: string, keepUserId: string) => {
    const legacy = await findAuthUserByEmail(email);
    if (legacy && legacy._id !== keepUserId) {
      await updateAuthUserCore({ userId: legacy._id, status: UserStatus.SUSPENDED });
    }
  };

  await suspendLegacyDemoUser('vendor@uaetrails.app', shopOwner._id);
  await suspendLegacyDemoUser('guide2@uaetrails.app', individualHost._id);

  const demandNow = new Date();
  const demandSeedIds = [
    seedDemandId('demand-hike-hatta'),
    seedDemandId('demand-camp-fossil-rock'),
    seedDemandId('demand-event-kite-beach'),
    seedDemandId('demand-rideshare-dxb-rak'),
  ];
  await db().collection('participant_intents').deleteMany({
    _id: { $in: demandSeedIds },
  });

  await db().collection('participant_intents').updateOne(
    { _id: seedDemandId('demand-hike-hatta') },
    {
      $set: {
        userId: participant._id,
        title: 'Hiking buddies near Hatta',
        kind: 'hiking',
        date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        time: null,
        preferredArea: 'Hatta Dam loop, Wadi Hub area',
        latitude: 24.7847,
        longitude: 56.1136,
        locationPrecision: 'general',
        toLatitude: null,
        toLongitude: null,
        partySize: 2,
        comment: 'Looking for hiking buddies around Hatta this weekend.',
        status: 'active',
        updatedAt: demandNow
      },
      $setOnInsert: { createdAt: demandNow }
    },
    { upsert: true }
  );

  await db().collection('participant_intents').updateOne(
    { _id: seedDemandId('demand-camp-fossil-rock') },
    {
      $set: {
        userId: individualHost._id,
        title: 'Weekend desert camp at Fossil Rock',
        kind: 'camping',
        date: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10),
        time: '16:00',
        preferredArea: 'Fossil Rock, Sharjah desert',
        latitude: 25.22,
        longitude: 55.85,
        locationPrecision: 'general',
        toLatitude: null,
        toLongitude: null,
        partySize: 4,
        comment: 'Looking for people to join a weekend desert camp — tents and 4x4 preferred.',
        status: 'active',
        updatedAt: demandNow
      },
      $setOnInsert: { createdAt: demandNow }
    },
    { upsert: true }
  );

  await db().collection('participant_intents').updateOne(
    { _id: seedDemandId('demand-event-kite-beach') },
    {
      $set: {
        userId: agencyGuide._id,
        title: 'Sunrise yoga at Kite Beach',
        kind: 'event',
        date: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
        time: '06:00',
        preferredArea: 'Kite Beach running track, Dubai',
        latitude: 25.1654,
        longitude: 55.2553,
        locationPrecision: 'specific',
        toLatitude: null,
        toLongitude: null,
        partySize: 6,
        comment: 'Casual sunrise yoga meetup — bring your mat and water.',
        status: 'active',
        updatedAt: demandNow
      },
      $setOnInsert: { createdAt: demandNow }
    },
    { upsert: true }
  );

  await db().collection('participant_intents').updateOne(
    { _id: seedDemandId('demand-rideshare-dxb-rak') },
    {
      $set: {
        userId: pendingParticipant._id,
        title: 'Ride to Jebel Jais hike',
        kind: 'rideshare',
        date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        time: '07:30',
        preferredArea: 'Dubai Marina → Jebel Jais',
        latitude: 25.0782,
        longitude: 55.1394,
        locationPrecision: 'specific',
        toLatitude: 25.9433,
        toLongitude: 56.1422,
        partySize: 3,
        comment: 'Need a ride to Jebel Jais hike — happy to share fuel.',
        status: 'active',
        updatedAt: demandNow
      },
      $setOnInsert: { createdAt: demandNow }
    },
    { upsert: true }
  );

  console.log('Seed complete.');
  console.log(`Admin: admin@uaetrails.app (${admin.profile?.displayName ?? demoAccount('admin@uaetrails.app').displayName}) / ${demoAccount('admin@uaetrails.app').password}`);
  console.log(`Participant: visitor@uaetrails.app (${participant.profile?.displayName ?? demoAccount('visitor@uaetrails.app').displayName}) / ${demoAccount('visitor@uaetrails.app').password}`);
  console.log(`Individual host: host@uaetrails.app (${individualHost.profile?.displayName ?? demoAccount('host@uaetrails.app').displayName}) / ${demoAccount('host@uaetrails.app').password}`);
  console.log(`Agency owner: organizer@uaetrails.app (${agencyOwner.profile?.displayName ?? demoAccount('organizer@uaetrails.app').displayName}) / ${demoAccount('organizer@uaetrails.app').password}`);
  console.log(`Agency guide: guide@uaetrails.app (${agencyGuide.profile?.displayName ?? demoAccount('guide@uaetrails.app').displayName}) / ${demoAccount('guide@uaetrails.app').password}`);
  console.log(`Shop owner: shop@uaetrails.app (${shopOwner.profile?.displayName ?? demoAccount('shop@uaetrails.app').displayName}) / ${demoAccount('shop@uaetrails.app').password}`);
  console.log(`Pending participant: visitor2@uaetrails.app (${pendingParticipant.profile?.displayName ?? demoAccount('visitor2@uaetrails.app').displayName}) / ${demoAccount('visitor2@uaetrails.app').password} — incomplete signup profile (welcome wizard demo)`);
  console.log(`Suspended: suspended@uaetrails.app / ${suspendedDemo.password}`);
  console.log(`Agency tenant: ${agencyTenant.id} — ${agencyTenant.slug} (${agencyTenant.businessMode})`);
  console.log(`Individual host tenant: ${individualHostTenant.id} — ${individualHostTenant.slug}`);
  console.log(`Shop tenant: ${shopTenant.id} — ${shopTenant.slug} (${shopTenant.businessMode})`);
  console.log(`Pending application: Hatta Hiking Club (by ${pendingParticipant.email})`);
  console.log(`Seeded by admin id: ${admin._id}`);
  console.log(`Merchant stores: ${nikeMerchantProfile.shopName}, ${adidasMerchantProfile.shopName} (${seedProducts.length} products)`);
  console.log('Explore map demo pins: supply (hiking, camping, event, rideshare) + demand (all four types) + shops + agency');
  console.log(`Chat messages: mobile inbox demo (DMs, friends wall, outing chat) seeded`);
  console.log(
    'Inbox demo (visitor@): DMs with Fatima, Omar, Khalid; friends group + reactions; Jebel Jais outing chat + reactions'
  );
  console.log('Connections demo: see playbook above (buddies / pending / follow notifications)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongo();
  });
