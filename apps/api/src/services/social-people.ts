import type {
  BuddySummaryDTO,
  MemberFollowSummaryDTO,
  SocialPeopleDTO,
  SocialPeoplePreviewDTO,
  SocialPeopleSegment,
  SocialPersonBuddyRequestState,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { countUserCheckedInParticipations } from '../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../lib/auth-users.js';
import { listBuddiesForUser, listBuddyRequestsForUser } from '../lib/buddy-store.js';
import { listFollowingForUser } from '../lib/follow-store.js';
import { buildExploreMapPayload } from '../lib/explore-map.js';
import { enrichExploreMapPayloadViewerAccess } from '../lib/explore-map-viewer-access.js';
import { collectExploreSocialMapPreviewPeople } from '../lib/explore-social-map-preview.js';
import { canMessageUser } from './chat-policy.js';
import { buildMemberTripHintMap } from './member-trip-hints.js';

type PersonSeed = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  connectedAt?: string;
  followedAt?: string;
};

const buddyRequestStateForTarget = (
  targetUserId: string,
  viewerUserId: string,
  pendingIncoming: Set<string>,
  pendingOutgoing: Set<string>
): SocialPersonBuddyRequestState => {
  if (pendingIncoming.has(targetUserId)) return 'incoming';
  if (pendingOutgoing.has(targetUserId)) return 'outgoing';
  return 'none';
};

const mergePeople = (
  buddies: BuddySummaryDTO[],
  following: MemberFollowSummaryDTO[],
  segment: SocialPeopleSegment
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
    if (segment === 'friends') continue;
    if (!byId.has(row.userId)) {
      byId.set(row.userId, {
        userId: row.userId,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        followedAt: row.followedAt,
      });
    }
  }

  if (segment === 'friends') {
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

export const loadSocialPeople = async (input: {
  viewerUserId: string;
  userRole?: string | null;
  segment: SocialPeopleSegment;
}): Promise<SocialPeopleDTO> => {
  const segment = input.segment;
  const [buddies, following, requests, payload] = await Promise.all([
    listBuddiesForUser(input.viewerUserId),
    listFollowingForUser(input.viewerUserId),
    listBuddyRequestsForUser(input.viewerUserId, 'all'),
    buildExploreMapPayload(),
  ]);

  const pendingIncoming = new Set(
    requests.filter((r) => r.status === 'pending' && r.toUserId === input.viewerUserId).map((r) => r.fromUserId)
  );
  const pendingOutgoing = new Set(
    requests.filter((r) => r.status === 'pending' && r.fromUserId === input.viewerUserId).map((r) => r.toUserId)
  );

  const seeds = mergePeople(buddies, following, segment);
  const buddyIds = new Set(buddies.map((b) => b.userId));
  const userIds = seeds.map((s) => s.userId);

  const enriched = await enrichExploreMapPayloadViewerAccess(payload, {
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
  });
  const tripHints = buildMemberTripHintMap(new Set(userIds), enriched.items);

  const users = await findAuthUsersByIds(userIds);
  const userMap = new Map(users.map((user) => [user._id, user]));

  const attendedPairs = await Promise.all(
    userIds.map(async (userId) => [userId, await countUserCheckedInParticipations(userId)] as const)
  );
  const attendedMap = new Map(attendedPairs);

  const canMessagePairs = await Promise.all(
    userIds.map(async (userId) => {
      if (buddyIds.has(userId)) return [userId, true] as const;
      return [userId, await canMessageUser(input.viewerUserId, userId)] as const;
    })
  );
  const canMessageMap = new Map(canMessagePairs);

  const people: SocialPersonRowDTO[] = seeds.map((seed) => {
    const user = userMap.get(seed.userId);
    const city = user?.profile?.city;
    const cityLabel =
      city && city in USER_CITY_LABELS ? USER_CITY_LABELS[city as UserCity] : null;
    const relationship = buddyIds.has(seed.userId) ? 'friend' : 'following';
    const buddyRequestState = buddyRequestStateForTarget(
      seed.userId,
      input.viewerUserId,
      pendingIncoming,
      pendingOutgoing
    );
    const areBuddies = relationship === 'friend';
    const canSendBuddyRequest =
      !areBuddies && buddyRequestState === 'none' && seed.userId !== input.viewerUserId;

    return {
      userId: seed.userId,
      displayName: seed.displayName,
      avatarUrl: seed.avatarUrl,
      cityLabel,
      activitiesAttended: attendedMap.get(seed.userId) ?? 0,
      relationship,
      buddyRequestState,
      canMessage: canMessageMap.get(seed.userId) ?? false,
      canSendBuddyRequest,
      upcomingTrip: tripHints.get(seed.userId) ?? null,
    };
  });

  return { people: sortPeople(people) };
};

export const loadSocialPeoplePreview = async (input: {
  viewerUserId: string;
  userRole?: string | null;
}): Promise<SocialPeoplePreviewDTO> => {
  const [buddies, following, mapPayload] = await Promise.all([
    listBuddiesForUser(input.viewerUserId),
    listFollowingForUser(input.viewerUserId),
    buildExploreMapPayload(),
  ]);
  const buddyIds = new Set(buddies.map((b) => b.userId));
  const followedOnly = following.filter((row) => !buddyIds.has(row.userId));

  const enriched = await enrichExploreMapPayloadViewerAccess(mapPayload, {
    viewerUserId: input.viewerUserId,
    userRole: input.userRole ?? null,
  });
  const mapGoing = collectExploreSocialMapPreviewPeople(enriched.items, input.viewerUserId);

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
  for (const row of mapGoing) {
    push(row);
  }

  return {
    avatars: merged.slice(0, 3),
    friendUserIds: buddies.map((buddy) => buddy.userId),
    friendCount: buddies.length,
    followedCount: followedOnly.length,
    allCount: buddies.length + followedOnly.length,
  };
};
