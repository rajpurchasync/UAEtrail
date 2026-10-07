import type {
  BuddySummaryDTO,
  ExploreMapItemDTO,
  SocialPersonBuddyRequestState,
  SocialPersonRowDTO,
  SocialPersonTripHintDTO,
} from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { countUserCheckedInParticipations } from '../lib/activity-engagement-store.js';
import { findAuthUsersByIds } from '../lib/auth-users.js';
import { listBuddyRequestsForUser } from '../lib/buddy-store.js';
import {
  matchesExploreActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';
import { canMessageUser } from './chat-policy.js';
import { buildBuddyActivityPresenceRows } from './buddy-activity-presence.js';

const activityHostUserId = (item: ExploreMapItemDTO): string | null => {
  if (item.source !== 'activity') return null;
  return item.featuredPerson?.userId ?? item.activity?.hostUserId ?? null;
};

const toTripHint = (
  item: ExploreMapItemDTO,
  role: SocialPersonTripHintDTO['role']
): SocialPersonTripHintDTO => ({
  activityId: item.activity?.id ?? item.id.replace(/^activity:/, ''),
  exploreItemId: item.id,
  title: item.title ?? item.activity?.title ?? 'Outing',
  date: item.date ?? null,
  time: item.time ?? null,
  role,
});

const buddyRequestStateForTarget = (
  targetUserId: string,
  pendingIncoming: Set<string>,
  pendingOutgoing: Set<string>
): SocialPersonBuddyRequestState => {
  if (pendingIncoming.has(targetUserId)) return 'incoming';
  if (pendingOutgoing.has(targetUserId)) return 'outgoing';
  return 'none';
};

const enrichSocialRows = async (
  viewerUserId: string,
  buddyIds: Set<string>,
  seeds: Array<{ userId: string; displayName: string; avatarUrl: string | null; upcomingTrip: SocialPersonTripHintDTO | null }>
): Promise<SocialPersonRowDTO[]> => {
  if (seeds.length === 0) return [];

  const userIds = seeds.map((s) => s.userId);
  const [users, requests, attendedPairs, messagePairs] = await Promise.all([
    findAuthUsersByIds(userIds),
    listBuddyRequestsForUser(viewerUserId, 'all'),
    Promise.all(userIds.map(async (id) => [id, await countUserCheckedInParticipations(id)] as const)),
    Promise.all(
      userIds.map(async (id) => {
        if (buddyIds.has(id)) return [id, true] as const;
        return [id, await canMessageUser(viewerUserId, id)] as const;
      })
    ),
  ]);

  const userMap = new Map(users.map((u) => [u._id, u]));
  const attendedMap = new Map(attendedPairs);
  const messageMap = new Map(messagePairs);
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
      canMessage: messageMap.get(seed.userId) ?? false,
      canSendBuddyRequest:
        !areBuddies && buddyRequestState === 'none' && seed.userId !== viewerUserId,
      upcomingTrip: seed.upcomingTrip,
    };
  });
};

/** Accepted buddies on outings for the date filter (hosting or joining). */
export const buildMemberDiscoveryFriendsGoing = async (
  viewerUserId: string,
  buddies: BuddySummaryDTO[],
  mapItems: ExploreMapItemDTO[],
  datePreset: ExploreActivityDatePreset
): Promise<SocialPersonRowDTO[]> => {
  const buddyIds = new Set(buddies.map((b) => b.userId));
  const presence = buildBuddyActivityPresenceRows(buddies, mapItems, datePreset).filter(
    (row) => row.hosting || row.joining
  );

  const itemByExploreId = new Map(mapItems.map((item) => [item.id, item]));

  const seeds = presence.map((row) => {
    const ref = row.hosting ?? row.joining!;
    const item = itemByExploreId.get(ref.exploreItemId);
    const role: SocialPersonTripHintDTO['role'] = row.hosting ? 'hosting' : 'joining';
    const upcomingTrip: SocialPersonTripHintDTO =
      item && row.hosting
        ? toTripHint(item, 'hosting')
        : item && row.joining
          ? toTripHint(item, 'joining')
          : {
              activityId: ref.activityId,
              exploreItemId: ref.exploreItemId,
              title: ref.title,
              date: null,
              time: null,
              role,
            };

    return {
      userId: row.buddy.userId,
      displayName: row.buddy.displayName,
      avatarUrl: row.buddy.avatarUrl,
      upcomingTrip,
    };
  });

  const rows = await enrichSocialRows(viewerUserId, buddyIds, seeds);
  return [...rows].sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
};

/** Activity hosts on the map (non-buddies) for the date filter. */
export const buildMemberDiscoveryHostsGoing = async (
  viewerUserId: string,
  buddyIds: Set<string>,
  mapItems: ExploreMapItemDTO[],
  datePreset: ExploreActivityDatePreset,
  search?: string
): Promise<SocialPersonRowDTO[]> => {
  const needle = search?.trim().toLowerCase();
  const visible = mapItems
    .filter((item) => item.source === 'activity' && item.activity)
    .filter((item) => matchesExploreActivityDateFilter(item, datePreset))
    .filter((item) => item.viewerAccess?.exposure !== 'none');

  const hostByUserId = new Map<
    string,
    { displayName: string; avatarUrl: string | null; item: ExploreMapItemDTO }
  >();

  for (const item of visible) {
    const hostId = activityHostUserId(item);
    if (!hostId || hostId === viewerUserId || buddyIds.has(hostId)) continue;

    const displayName = item.featuredPerson?.displayName ?? item.hostName ?? 'Host';
    if (needle && !displayName.toLowerCase().includes(needle) && !item.title?.toLowerCase().includes(needle)) {
      continue;
    }

    if (!hostByUserId.has(hostId)) {
      hostByUserId.set(hostId, {
        displayName,
        avatarUrl: item.featuredPerson?.avatarUrl ?? item.hostAvatar ?? null,
        item,
      });
    }
  }

  const seeds = [...hostByUserId.entries()].map(([userId, row]) => ({
    userId,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    upcomingTrip: toTripHint(row.item, 'hosting'),
  }));

  const rows = await enrichSocialRows(viewerUserId, buddyIds, seeds);
  return [...rows].sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
};
