/**
 * Local QA bundle: extra demo personas, social graph, and 20 map-visible outings.
 */
import bcrypt from 'bcryptjs';
import { ActivityStatus, ActivityType, RequestStatus } from '../src/domain/enums.js';
import { DEV_QA_PERSONAS } from '../src/lib/dev-demo-personas.js';
import { DEMO_ACCOUNTS, resolveDemoAccountPassword } from '../src/lib/demo-accounts.js';
import {
  findAuthUserByEmail,
  createAuthUser,
  updateAuthUserProfile,
  type AuthUserRecord,
} from '../src/lib/auth-users-store.js';
import { AuthProvider, UserStatus } from '../src/domain/enums.js';
import {
  acceptFriendRequest,
  createFriendRequest,
} from '../src/lib/friend-store.js';
import { followUser } from '../src/lib/follow-store.js';
import {
  buildActivityFromCreateInput,
  type ActivityCreateInput,
} from '../src/lib/entity-builders.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { findActivityDocInMongo, writeActivityDocToMongo } from '../src/lib/entity-sync.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { invalidateExploreMapCache } from '../src/lib/explore-map-cache.js';
import { ApiError } from '../src/lib/api-error.js';
import type { DemoActivitySeedContext } from './seed-demo-scheduled-activities.js';
import crypto from 'node:crypto';

const QA_LOCATIONS = [
  {
    id: 'jebel-jais-summit-trail',
    lat: 25.9433,
    lng: 56.1422,
    meeting: 'Jebel Jais Viewing Deck parking',
  },
  { id: 'wadi-shawka-loop', lat: 25.1338, lng: 56.0572, meeting: 'Wadi Shawka dam parking' },
  { id: 'fossil-rock-desert-camp', lat: 25.118, lng: 55.787, meeting: 'Fossil Rock base' },
  { id: 'hatta-dam-loop', lat: 24.7847, lng: 56.118, meeting: 'Hatta Dam parking' },
  { id: 'hatta-wadi-hub-loop', lat: 24.82, lng: 56.13, meeting: 'Hatta Wadi Hub' },
  { id: 'al-qudra-cycling-loop', lat: 24.985, lng: 55.219, meeting: 'Al Qudra Last Exit' },
  { id: 'jumeirah-kite-beach', lat: 25.168, lng: 55.21, meeting: 'Kite Beach pavilion' },
  { id: 'khorfakkan-beach-trail', lat: 25.356, lng: 56.356, meeting: 'Khorfakkan corniche' },
  { id: 'al-ain-desert-camp', lat: 24.05, lng: 55.55, meeting: 'Al Ain dune base' },
  { id: 'dibba-beach-camp', lat: 25.62, lng: 56.27, meeting: 'Dibba beach parking' },
] as const;

const ACTIVITY_TYPES: ActivityType[] = [
  ActivityType.HIKING,
  ActivityType.HIKING,
  ActivityType.CAMPING,
  ActivityType.EVENT,
  ActivityType.HIKING,
  ActivityType.RIDESHARE,
  ActivityType.HIKING,
  ActivityType.CAMPING,
  ActivityType.EVENT,
  ActivityType.HIKING,
  ActivityType.HIKING,
  ActivityType.CAMPING,
  ActivityType.EVENT,
  ActivityType.HIKING,
  ActivityType.RIDESHARE,
  ActivityType.HIKING,
  ActivityType.CAMPING,
  ActivityType.EVENT,
  ActivityType.HIKING,
  ActivityType.HIKING,
];

/** day offsets from today for 20 outings — spread across this week, month, +2 months. */
const START_DAY_OFFSETS = [
  1, 2, 4, 6, 8, 10, 12, 14, 18, 22, 28, 35, 42, 50, 58, 66, 74, 82, 88, 90,
];

const upsertEvent = async (id: string, data: ActivityCreateInput) => {
  const doc = buildActivityFromCreateInput(data, id);
  const existing = await findActivityDocInMongo(id);
  if (existing) doc.createdAt = existing.createdAt;
  await writeActivityDocToMongo(doc);
};

const buildReferralCode = (email: string) =>
  email
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, '0') + crypto.randomBytes(3).toString('hex').toUpperCase();

const upsertPersona = async (email: string): Promise<AuthUserRecord> => {
  const def = DEMO_ACCOUNTS[email];
  if (!def) throw new Error(`Missing demo account definition for ${email}`);
  const passwordHash = await bcrypt.hash(resolveDemoAccountPassword(email), 10);
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    await updateAuthUserProfile(existing._id, {
      displayName: def.displayName,
      profileVisibility: 'public',
      friendsListShare: email.includes('participant') ? 'friends_crew' : 'mutual_only',
    });
    return existing;
  }
  return createAuthUser({
    email,
    passwordHash,
    googleId: null,
    authProvider: AuthProvider.EMAIL,
    role: def.role,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    referralCode: buildReferralCode(email),
    profile: {
      displayName: def.displayName,
      phone: null,
      bio: `QA persona (${def.role}) for friends, groups, and map testing.`,
      avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
      profileVisibility: 'public',
      friendsListShare: 'friends_crew',
    },
  });
};

const seedParticipant = async (activityId: string, userId: string, reviewerId: string, pending = false) => {
  const db = getMongoClient()!.db();
  const now = new Date();
  const requestId = crypto.randomUUID();
  await db.collection(COLLECTIONS.ACTIVITY_REQUESTS).updateOne(
    { activityId, userId },
    {
      $set: {
        status: pending ? RequestStatus.PENDING : RequestStatus.APPROVED,
        reviewedById: pending ? null : reviewerId,
        reviewedAt: pending ? null : now,
        updatedAt: now,
        note: pending ? 'Keen to join — testing pending queue' : null,
      },
      $setOnInsert: {
        _id: requestId,
        hostNote: pending ? null : 'Welcome — see you there.',
        cancelReason: null,
        cancelMessage: null,
        cancelledAt: null,
        selectedPackageIndex: null,
        createdAt: now,
      },
    },
    { upsert: true }
  );
  if (!pending) {
    const approvedRequest = await db
      .collection(COLLECTIONS.ACTIVITY_REQUESTS)
      .findOne({ activityId, userId }, { projection: { _id: 1 } });
    const stableRequestId = approvedRequest?._id ?? requestId;
    await db.collection(COLLECTIONS.ACTIVITY_PARTICIPANTS).updateOne(
      { activityId, userId },
      {
        $set: { requestId: stableRequestId, approvedById: reviewerId },
        $setOnInsert: { _id: crypto.randomUUID(), checkedInAt: null, createdAt: now },
      },
      { upsert: true }
    );
  }
};

export const seedDevQaPersonas = async (): Promise<string[]> => {
  const ids: string[] = [];
  for (const persona of DEV_QA_PERSONAS) {
    const user = await upsertPersona(persona.email);
    ids.push(user._id);
  }
  console.log(`[seed] Dev QA personas upserted: ${ids.length}`);
  return ids;
};

export const seedDevQaSocialGraph = async (): Promise<void> => {
  const p1 = await findAuthUserByEmail('dev-participant-1@uaetrails.app');
  const p2 = await findAuthUserByEmail('dev-participant-2@uaetrails.app');
  const p3 = await findAuthUserByEmail('dev-participant-3@uaetrails.app');
  const g1 = await findAuthUserByEmail('dev-guide-1@uaetrails.app');
  const g2 = await findAuthUserByEmail('dev-guide-2@uaetrails.app');
  const visitor = await findAuthUserByEmail('visitor@uaetrails.app');
  const host = await findAuthUserByEmail('host@uaetrails.app');

  if (!p1 || !p2 || !p3 || !g1 || !g2 || !visitor || !host) {
    console.warn('[seed] Dev QA social graph skipped — personas missing');
    return;
  }

  const buddyPairs: Array<[string, string]> = [
    [p1._id, p2._id],
    [p1._id, g1._id],
    [p2._id, g2._id],
    [p2._id, p3._id],
    [visitor._id, p1._id],
    [visitor._id, p3._id],
    [host._id, g2._id],
    [g1._id, p3._id],
  ];
  for (const [from, to] of buddyPairs) {
    try {
      const req = await createFriendRequest({ fromUserId: from, toUserId: to, message: 'QA buddy link' });
      if (req.status === 'pending') await acceptFriendRequest(req.id, to);
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'already_buddies') throw error;
    }
  }

  const followPairs: Array<[string, string]> = [
    [p1._id, g1._id],
    [p2._id, g1._id],
    [p3._id, g2._id],
    [visitor._id, p2._id],
    [visitor._id, p3._id],
    [p1._id, host._id],
    [p2._id, host._id],
    [p3._id, visitor._id],
    [g2._id, p1._id],
    [host._id, p1._id],
  ];
  for (const [follower, following] of followPairs) {
    await followUser(follower, following);
  }

  console.log('[seed] Dev QA social graph: buddies + follows wired');
};

export const seedDevQaTwentyActivities = async (ctx: DemoActivitySeedContext): Promise<void> => {
  const participantIds = (
    await Promise.all([
      findAuthUserByEmail('dev-participant-1@uaetrails.app'),
      findAuthUserByEmail('dev-participant-2@uaetrails.app'),
      findAuthUserByEmail('dev-participant-3@uaetrails.app'),
      findAuthUserByEmail('visitor@uaetrails.app'),
    ])
  )
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => row._id);

  for (let index = 0; index < 20; index += 1) {
    const id = `seed-qa-act-${String(index + 1).padStart(2, '0')}`;
    const spot = QA_LOCATIONS[index % QA_LOCATIONS.length];
    const activityType = ACTIVITY_TYPES[index];
    const startAt = new Date();
    startAt.setDate(startAt.getDate() + START_DAY_OFFSETS[index]);
    startAt.setHours(7 + (index % 5) * 2, index % 2 === 0 ? 0 : 30, 0, 0);

    const useAgency = index % 2 === 0;
    const tenantId = useAgency ? ctx.agencyTenantId : ctx.individualHostTenantId;
    const hostId = useAgency ? ctx.agencyGuideId : ctx.individualHostId;
    const createdBy = useAgency ? ctx.agencyOwnerId : ctx.individualHostId;

    await upsertEvent(id, {
      tenant: { connect: { id: tenantId } },
      location: { connect: { id: spot.id } },
      createdBy: { connect: { id: createdBy } },
      host: { connect: { id: hostId } },
      activityType,
      title: `QA outing ${index + 1} — ${spot.id.replace(/-/g, ' ')}`,
      description: 'Seeded for local map and join testing.',
      startAt,
      meetingPoint: spot.meeting,
      meetingLat: spot.lat,
      meetingLng: spot.lng,
      priceAed: activityType === ActivityType.CAMPING ? 99 : activityType === ActivityType.RIDESHARE ? 30 : 0,
      capacity: activityType === ActivityType.RIDESHARE ? 4 : 12,
      status: ActivityStatus.PUBLISHED,
      publishedAt: new Date(),
      itinerary: ['Meet at pin', 'Main block', 'Wrap'],
      requirements: ['Water', 'Appropriate footwear'],
      outingCategory:
        activityType === ActivityType.HIKING
          ? 'hiking'
          : activityType === ActivityType.CAMPING
            ? 'camping'
            : activityType === ActivityType.RIDESHARE
              ? 'rideshare'
              : 'events',
      ...(activityType === ActivityType.EVENT ? { participationMode: 'rsvp' as const } : {}),
    });

    if (participantIds.length === 0) continue;
    const reviewer = createdBy;
    const primary = participantIds[index % participantIds.length];
    const secondary = participantIds[(index + 1) % participantIds.length];
    if (index % 3 !== 2) {
      await seedParticipant(id, primary, reviewer, false);
    }
    if (index % 4 === 1 && secondary !== primary) {
      await seedParticipant(id, secondary, reviewer, true);
    }
  }

  await invalidateExploreMapCache();
  console.log('[seed] Dev QA: 20 published outings across 10 spots (map cache invalidated)');
};

export const runDevQaBundleSeed = async (ctx: DemoActivitySeedContext | null): Promise<void> => {
  if (process.env.NODE_ENV === 'production') return;
  if (process.env.SEED_DEV_QA === '0') return;
  await seedDevQaPersonas();
  await seedDevQaSocialGraph();
  if (ctx) {
    await seedDevQaTwentyActivities(ctx);
  }
};
