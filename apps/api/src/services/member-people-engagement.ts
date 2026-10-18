import {
  isBuddyPeopleSegment,
  normalizePeopleSegment,
  type BuddySummaryDTO,
  type MemberFollowSummaryDTO,
  type SocialPeopleDTO,
  type SocialPeoplePreviewDTO,
  type SocialPeopleSegmentWire,
  type SocialPersonBuddyRequestState,
  type SocialPersonRowDTO,
  type SocialPersonTripHintDTO,
} from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { countCheckedInParticipationsForUserIds } from '../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { listBuddiesForUser, listBuddyRequestsForUser } from '../lib/buddy-store.js';
import { listFollowingForUser } from '../lib/follow-store.js';
import { loadExploreMapItemsForMemberEngagement } from '../lib/explore-map-member-engagement.js';
import { filterInboxMessageablePartnerIds } from './chat-policy.js';
import { buildMemberTripHintMap } from './member-trip-hints.js';

export type MemberPersonRowSeed = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  upcomingTrip: SocialPersonTripHintDTO | null;
};

const buddyRequestStateForTarget = (
  targetUserId: string,
  pendingIncoming: Set<string>,
  pendingOutgoing: Set<string>
): SocialPersonBuddyRequestState => {
  if (pendingIncoming.has(targetUserId)) return 'incoming';
  if (pendingOutgoing.has(targetUserId)) return 'outgoing';
  return 'none';
};

/** Hydrate browse person rows (relationship, messaging, attendance, buddy request state). */
export const enrichMemberPersonRows = async (
  viewerUserId: string,
  buddyIds: Set<string>,
  seeds: MemberPersonRowSeed[]
): Promise<SocialPersonRowDTO[]> => {
  if (seeds.length === 0) return [];

  const userIds = seeds.map((s) => s.userId);
  const [users, requests, attendedMap, messageablePartnerIds] = await Promise.all([
    findAuthUsersByIds(userIds),
    listBuddyRequestsForUser(viewerUserId, 'all'),
    countCheckedInParticipationsForUserIds(userIds),
    filterInboxMessageablePartnerIds(viewerUserId, userIds),
  ]);

  const userMap = new Map(users.map((u) => [u._id, u]));
  const pendingIncoming = new Set(
    requests
      .filter((r) => r.status === 'pending' && r.toUserId === viewerUserId)
      .map((r) => r.fromUserId)
      .filter(Boolean) as string[]
  );
  const pendingOutgoing = new Set(
    requests
      .filter((r) => r.status === 'pending' && r.fromUserId === viewerUserId)
      .map((r) => r.toUserId)
      .filter(Boolean) as string[]
  );

  return seeds.map((seed) => {
    const user = userMap.get(seed.userId);
    const city = user?.profile?.city;
    const cityLabel =
      city && city in USER_CITY_LABELS ? USER_CITY_LABELS[city as UserCity] : null;
    const relationship = buddyIds.has(seed.userId) ? 'friend' : 'following';
    const buddyRequestState = buddyRequestStateForTarget(
      seed.userId,
      pendingIncoming,
      pendingOutgoing
    );
    const areBuddies = relationship === 'friend';

    return {
      userId: seed.userId,
      displayName: seed.displayName,
      avatarUrl: seed.avatarUrl,
      cityLabel,
      activitiesAttended: attendedMap.get(seed.userId) ?? 0,
      relationship,
      buddyRequestState,
      canMessage: buddyIds.has(seed.userId) || messageablePartnerIds.has(seed.userId),
      canSendBuddyRequest:
        !areBuddies && buddyRequestState === 'none' && seed.userId !== viewerUserId,
      upcomingTrip: seed.upcomingTrip,
    };
  });
};

type PersonSeed = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt?: string;
  followedAt?: string;
};

const mergeNetworkPeople = (
  buddies: BuddySummaryDTO[],
  following: MemberFollowSummaryDTO[],
  segment: SocialPeopleSegmentWire
): PersonSeed[] => {
  const buddyIds = new Set(buddies.map((b) => b.userId));
  const byId = new Map<string, PersonSeed>();

  for (const buddy of buddies) {
    byId.set(buddy.userId, {
      userId: buddy.userId,
      displayName: buddy.displayName,
      avatarUrl: buddy.avatarUrl,
      connectedAt: buddy.connectedAt,
    });
  }

  for (const row of following) {
    if (segment === 'followed' && buddyIds.has(row.userId)) continue;
    if (isBuddyPeopleSegment(segment)) continue;
    if (!byId.has(row.userId)) {
      byId.set(row.userId, {
        userId: row.userId,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        followedAt: row.followedAt,
      });
    }
  }

  if (isBuddyPeopleSegment(segment)) {
    return buddies.map((buddy) => byId.get(buddy.userId)!);
  }

  if (segment === 'followed') {
    return following
      .filter((row) => !buddyIds.has(row.userId))
      .map((row) => byId.get(row.userId)!)
      .filter((row): row is PersonSeed => row != null);
  }

  const merged: PersonSeed[] = [];
  const seen = new Set<string>();
  for (const buddy of buddies) {
    if (seen.has(buddy.userId)) continue;
    seen.add(buddy.userId);
    merged.push(byId.get(buddy.userId)!);
  }
  for (const row of following) {
    if (seen.has(row.userId)) continue;
    seen.add(row.userId);
    merged.push(byId.get(row.userId)!);
  }
  return merged;
};

const sortPeople = (rows: SocialPersonRowDTO[]): SocialPersonRowDTO[] =>
  [...rows].sort((a, b) => {
    if (a.relationship !== b.relationship) {
      return a.relationship === 'friend' ? -1 : 1;
    }
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
  });

/** Friends + following roster for browse people panel (map network tabs). */
export const loadMemberPeopleNetworkRoster = async (input: {
  viewerUserId: string;
  userRole?: string | null;
  segment: SocialPeopleSegmentWire;
}): Promise<SocialPeopleDTO> => {
  const segment = normalizePeopleSegment(input.segment);
  const [buddies, following, mapItems] = await Promise.all([
    listBuddiesForUser(input.viewerUserId),
    listFollowingForUser(input.viewerUserId),
    loadExploreMapItemsForMemberEngagement({
      viewerUserId: input.viewerUserId,
      userRole: input.userRole,
    }),
  ]);

  const networkSeeds = mergeNetworkPeople(buddies, following, segment);
  const buddyIds = new Set(buddies.map((b) => b.userId));
  const tripHints = buildMemberTripHintMap(
    new Set(networkSeeds.map((s) => s.userId)),
    mapItems
  );

  const rowSeeds: MemberPersonRowSeed[] = networkSeeds.map((seed) => ({
    userId: seed.userId,
    displayName: seed.displayName,
    avatarUrl: seed.avatarUrl,
    upcomingTrip: tripHints.get(seed.userId) ?? null,
  }));

  const people = await enrichMemberPersonRows(input.viewerUserId, buddyIds, rowSeeds);
  return { people: sortPeople(people) };
};

/** Network-only preview; map outing faces are merged on the client from cached explore map. */
export const loadMemberPeopleNetworkPreview = async (input: {
  viewerUserId: string;
  userRole?: string | null;
}): Promise<SocialPeoplePreviewDTO> => {
  const [buddies, following] = await Promise.all([
    listBuddiesForUser(input.viewerUserId),
    listFollowingForUser(input.viewerUserId),
  ]);
  const buddyIds = new Set(buddies.map((b) => b.userId));
  const followedOnly = following.filter((row) => !buddyIds.has(row.userId));

  const merged: Array<{ userId: string; displayName: string; avatarUrl: string | null }> = [];
  const seen = new Set<string>();
  const push = (row: { userId: string; displayName: string; avatarUrl: string | null }) => {
    if (!row.userId || seen.has(row.userId)) return;
    seen.add(row.userId);
    merged.push(row);
  };

  for (const buddy of buddies) {
    push({
      userId: buddy.userId,
      displayName: buddy.displayName,
      avatarUrl: buddy.avatarUrl,
    });
  }
  for (const row of followedOnly) {
    push({
      userId: row.userId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
    });
  }

  return {
    avatars: merged.slice(0, 3),
    friendUserIds: buddies.map((buddy) => buddy.userId),
    friendCount: buddies.length,
    followedCount: followedOnly.length,
    allCount: buddies.length + followedOnly.length,
  };
};
