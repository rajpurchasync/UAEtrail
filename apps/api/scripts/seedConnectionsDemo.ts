/**
 * Demo buddy requests, buddy pairs, and follows for local QA.
 * Primary tester: visitor@uaetrails.app (Samira Khan).
 */
import {
  acceptBuddyRequest,
  createBuddyRequest,
  declineBuddyRequest,
} from '../src/lib/buddy-store.js';
import { followUser } from '../src/lib/follow-store.js';
import { COLLECTIONS } from '../src/lib/collections.js';
import { getMongoClient } from '../src/lib/mongo.js';
import { notifyMemberFollowed } from '../src/services/social-notifications.js';
import { upsertMemberAvailability } from '../src/lib/member-availability-store.js';
import { RequestStatus } from '../src/domain/enums.js';
import crypto from 'node:crypto';

const isoDayOffset = (days: number): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const seedPeopleBrowseDemoAvailability = async (
  userId: string,
  input: { kinds: ('hiking' | 'camping')[]; region: string; slotDays: { start: number; end: number } }
): Promise<void> => {
  await upsertMemberAvailability(userId, {
    kinds: input.kinds,
    visibility: 'public',
    region: input.region,
    slots: [
      {
        startDate: isoDayOffset(input.slotDays.start),
        endDate: isoDayOffset(input.slotDays.end),
        timeBand: 'any',
      },
    ],
  });
};

const seedBuddyOnShawkaHike = async (guideId: string, reviewerId: string): Promise<void> => {
  const db = getMongoClient()!.db();
  const activityId = 'seed-event-shawka-free';
  const now = new Date();
  await db.collection('activity_requests').updateOne(
    { activityId, userId: guideId },
    {
      $set: {
        status: RequestStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: crypto.randomUUID(),
        note: 'Leading this one — listed as going for crew browse QA',
        organizerNote: null,
        cancelReason: null,
        cancelMessage: null,
        cancelledAt: null,
        selectedPackageIndex: null,
        createdAt: now,
      },
    },
    { upsert: true }
  );
};

export type ConnectionsDemoInput = {
  visitorId: string;
  visitor2Id: string;
  guideId: string;
  hostId: string;
  organizerId: string;
  shopOwnerId: string;
};

const demoUserIds = (input: ConnectionsDemoInput): string[] => [
  input.visitorId,
  input.visitor2Id,
  input.guideId,
  input.hostId,
  input.organizerId,
  input.shopOwnerId,
];

export const resetConnectionsDemoData = async (userIds: string[]): Promise<void> => {
  const db = getMongoClient()!.db();
  await db.collection('buddy_requests').deleteMany({
    $or: [{ fromUserId: { $in: userIds } }, { toUserId: { $in: userIds } }],
  });
  await db.collection('buddy_pairs').deleteMany({
    $or: userIds.map((id) => ({ userIds: id })),
  });
  await db.collection(COLLECTIONS.USER_FOLLOWS).deleteMany({
    $or: [{ followerId: { $in: userIds } }, { followingId: { $in: userIds } }],
  });
};

export const seedConnectionsDemo = async (input: ConnectionsDemoInput): Promise<void> => {
  const userIds = demoUserIds(input);
  await resetConnectionsDemoData(userIds);

  const visitorGuide = await createBuddyRequest({
    fromUserId: input.visitorId,
    toUserId: input.guideId,
    message: 'See you on the Shawka loop — connect here?',
  });
  if (visitorGuide.status === 'pending') {
    await acceptBuddyRequest(visitorGuide.id, input.guideId);
  }

  const incomingFromMaya = await createBuddyRequest({
    fromUserId: input.visitor2Id,
    toUserId: input.visitorId,
    message: 'Want to be trail buddies?',
  });
  if (incomingFromMaya.status === 'pending') {
    await acceptBuddyRequest(incomingFromMaya.id, input.visitorId);
  }

  await createBuddyRequest({
    fromUserId: input.visitorId,
    toUserId: input.hostId,
    message: 'Fossil Rock camp — happy to connect!',
  });

  const khalidRequest = await createBuddyRequest({
    fromUserId: input.organizerId,
    toUserId: input.visitorId,
    message: 'Jebel Jais crew — add me?',
  });
  if (khalidRequest.status === 'pending') {
    await declineBuddyRequest(khalidRequest.id, input.visitorId);
  }

  await followUser(input.visitor2Id, input.visitorId);
  await notifyMemberFollowed({
    followerUserId: input.visitor2Id,
    followingUserId: input.visitorId,
  });
  await followUser(input.shopOwnerId, input.visitorId);
  await notifyMemberFollowed({
    followerUserId: input.shopOwnerId,
    followingUserId: input.visitorId,
  });
  await followUser(input.visitorId, input.organizerId);
  await followUser(input.visitorId, input.hostId);

  const hostGuide = await createBuddyRequest({
    fromUserId: input.hostId,
    toUserId: input.guideId,
    message: 'Shawka crew — connect on UAE Trail?',
  });
  if (hostGuide.status === 'pending') {
    await acceptBuddyRequest(hostGuide.id, input.guideId);
  }

  await seedPeopleBrowseDemoAvailability(input.visitor2Id, {
    kinds: ['hiking', 'camping'],
    region: 'Dubai',
    slotDays: { start: 1, end: 4 },
  });
  await seedPeopleBrowseDemoAvailability(input.guideId, {
    kinds: ['hiking'],
    region: 'Sharjah',
    slotDays: { start: 2, end: 5 },
  });
  await seedPeopleBrowseDemoAvailability(input.hostId, {
    kinds: ['camping', 'hiking'],
    region: 'Ras Al Khaimah',
    slotDays: { start: 0, end: 2 },
  });
  await seedPeopleBrowseDemoAvailability(input.visitorId, {
    kinds: ['hiking'],
    region: 'Dubai',
    slotDays: { start: 3, end: 6 },
  });

  await seedBuddyOnShawkaHike(input.guideId, input.organizerId);

  console.log(
    '[seed] Connections demo seeded (buddies, follows, people browse availability, host↔guide buddy)'
  );
};

export const logConnectionsDemoPlaybook = (): void => {
  console.log(
    'Connections QA (log in as visitor@uaetrails.app / Visitor@12345):\n' +
      '  • Find your crew → Available: Maya, Fatima, Omar, Samira (public slots; map date Anyday)\n' +
      '  • Friends going (host@): Fatima hosting Wadi Shawka (+10d) — set date to This month\n' +
      '  • Buddies: Fatima (guide@) + Maya (visitor2@)\n' +
      '  • Outgoing pending: Omar (host@) — cancel on /buddies (Sent) or his profile\n' +
      '  • Declined history: Khalid (organizer@) — declined in DB; re-request allowed via profile\n' +
      '  • Friends group: Weekend Hikers UAE — log in as guide@ and use Leave group on /groups\n' +
      '  • Social → Followed: Khalid (organizer@) + Omar (host@); pending buddy request still open to Omar\n' +
      '  • Notifications: follow alerts from Maya + Priya (shop@)'
  );
};
