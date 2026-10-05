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
import { notifyBuddyRequestReceived } from '../src/services/buddy-notifications.js';
import { notifyMemberFollowed } from '../src/services/social-notifications.js';

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

  console.log('[seed] Connections demo seeded for visitor@ (buddies, pending, follow notifications)');
};

export const logConnectionsDemoPlaybook = (): void => {
  console.log(
    'Connections QA (log in as visitor@uaetrails.app / Visitor@12345):\n' +
      '  • Buddies: Fatima (guide@) + Maya (visitor2@) — Explore Social → Friends\n' +
      '  • Outgoing pending: Omar (host@) — cancel on /buddies (Sent) or his profile\n' +
      '  • Declined history: Khalid (organizer@) — declined in DB; re-request allowed via profile\n' +
      '  • Friends group: Weekend Hikers UAE — log in as guide@ and use Leave group on /groups\n' +
      '  • Social → Followed: Khalid (organizer@) + Omar (host@); pending buddy request still open to Omar\n' +
      '  • Notifications: follow alerts from Maya + Priya (shop@)'
  );
};
