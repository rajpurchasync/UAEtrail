import {
  isFriendsPeopleSegment,
  normalizePeopleSegment,
  type FriendSummaryDTO,
  type MemberFollowSummaryDTO,
  type SocialPeopleDTO,
  type SocialPeoplePreviewDTO,
  type SocialPeopleSegmentWire,
  type SocialPersonFriendRequestState,
  type SocialPersonRowDTO,
  type SocialPersonTripHintDTO,
} from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { countCheckedInParticipationsForUserIds } from '../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { listFriendsForUser, listFriendRequestsForUser } from '../lib/friend-store.js';
import { listFollowingForUser } from '../lib/follow-store.js';
import { loadExploreMapItemsForMemberEngagement } from '../lib/explore-map-member-engagement.js';
import { filterInboxMessageablePartnerIds } from './chat-policy.js';
import { resolveCityLabelForViewer } from '../lib/find-crew-visibility-gate.js';
import { buildMemberTripHintMap } from './member-trip-hints.js';

export type MemberPersonRowSeed = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  upcomingTrip: SocialPersonTripHintDTO | null;
};

const friendRequestStateForTarget = (
  targetUserId: string,
  pendingIncoming: Set<string>,
  pendingOutgoing: Set<string>
): SocialPersonFriendRequestState => {
  if (pendingIncoming.has(targetUserId)) return 'incoming';
  if (pendingOutgoing.has(targetUserId)) return 'outgoing';
  return 'none';
};

/** Hydrate browse person rows (relationship, messaging, attendance, friend request state). */
export const enrichMemberPersonRows = async (
  viewerUserId: string,
  friendIds: Set<string>,
  seeds: MemberPersonRowSeed[]
): Promise<SocialPersonRowDTO[]> => {
  if (seeds.length === 0) return [];

  const userIds = seeds.map((s) => s.userId);
  const [users, requests, attendedMap, messageablePartnerIds] = await Promise.all([
    findAuthUsersByIds(userIds),
    listFriendRequestsForUser(viewerUserId, 'all'),
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

  return Promise.all(
    seeds.map(async (seed) => {
      const user = userMap.get(seed.userId);
      const city = user?.profile?.city;
      const rawCityLabel =
        city && city in USER_CITY_LABELS ? USER_CITY_LABELS[city as UserCity] : null;
      const relationship = friendIds.has(seed.userId) ? 'friend' : 'following';
      const friendRequestState = friendRequestStateForTarget(
        seed.userId,
        pendingIncoming,
        pendingOutgoing
      );
      const areFriends = relationship === 'friend';
      const cityLabel = user
        ? await resolveCityLabelForViewer(user, viewerUserId, rawCityLabel, {
            isFriend: areFriends,
          })
        : null;

      return {
        userId: seed.userId,
        displayName: seed.displayName,
        avatarUrl: seed.avatarUrl,
        cityLabel,
        activitiesAttended: attendedMap.get(seed.userId) ?? 0,
        relationship,
        friendRequestState,
        canMessage: friendIds.has(seed.userId) || messageablePartnerIds.has(seed.userId),
        canSendFriendRequest:
          !areFriends && friendRequestState === 'none' && seed.userId !== viewerUserId,
        upcomingTrip: seed.upcomingTrip,
      };
    })
  );
};

type PersonSeed = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt?: string;
  followedAt?: string;
};

const mergeNetworkPeople = (
  friends: FriendSummaryDTO[],
  following: MemberFollowSummaryDTO[],
  segment: SocialPeopleSegmentWire
): PersonSeed[] => {
  const friendIds = new Set(friends.map((b) => b.userId));
  const byId = new Map<string, PersonSeed>();

  for (const friend of friends) {
    byId.set(friend.userId, {
      userId: friend.userId,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
      connectedAt: friend.connectedAt,
    });
  }

  for (const row of following) {
    if (segment === 'followed' && friendIds.has(row.userId)) continue;
    if (isFriendsPeopleSegment(segment)) continue;
    if (!byId.has(row.userId)) {
      byId.set(row.userId, {
        userId: row.userId,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        followedAt: row.followedAt,
      });
    }
  }

  if (isFriendsPeopleSegment(segment)) {
    return friends.map((friend) => byId.get(friend.userId)!);
  }

  if (segment === 'followed') {
    return following
      .filter((row) => !friendIds.has(row.userId))
      .map((row) => byId.get(row.userId)!)
      .filter((row): row is PersonSeed => row != null);
  }

  const merged: PersonSeed[] = [];
  const seen = new Set<string>();
  for (const friend of friends) {
    if (seen.has(friend.userId)) continue;
    seen.add(friend.userId);
    merged.push(byId.get(friend.userId)!);
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
  const [friends, following, mapItems] = await Promise.all([
    listFriendsForUser(input.viewerUserId),
    listFollowingForUser(input.viewerUserId),
    loadExploreMapItemsForMemberEngagement({
      viewerUserId: input.viewerUserId,
      userRole: input.userRole,
    }),
  ]);

  const networkSeeds = mergeNetworkPeople(friends, following, segment);
  const friendIds = new Set(friends.map((b) => b.userId));
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

  const people = await enrichMemberPersonRows(input.viewerUserId, friendIds, rowSeeds);
  return { people: sortPeople(people) };
};

/** Network-only preview; map outing faces are merged on the client from cached explore map. */
export const loadMemberPeopleNetworkPreview = async (input: {
  viewerUserId: string;
  userRole?: string | null;
}): Promise<SocialPeoplePreviewDTO> => {
  const [friends, following] = await Promise.all([
    listFriendsForUser(input.viewerUserId),
    listFollowingForUser(input.viewerUserId),
  ]);
  const friendIds = new Set(friends.map((b) => b.userId));
  const followedOnly = following.filter((row) => !friendIds.has(row.userId));

  const merged: Array<{ userId: string; displayName: string; avatarUrl: string | null }> = [];
  const seen = new Set<string>();
  const push = (row: { userId: string; displayName: string; avatarUrl: string | null }) => {
    if (!row.userId || seen.has(row.userId)) return;
    seen.add(row.userId);
    merged.push(row);
  };

  for (const friend of friends) {
    push({
      userId: friend.userId,
      displayName: friend.displayName,
      avatarUrl: friend.avatarUrl,
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
    friendUserIds: friends.map((friend) => friend.userId),
    followedUserIds: followedOnly.map((row) => row.userId),
    friendCount: friends.length,
    followedCount: followedOnly.length,
    allCount: friends.length + followedOnly.length,
  };
};
