import type {
  FriendSummaryDTO,
  ExploreMapItemDTO,
  SocialPersonRowDTO,
  SocialPersonTripHintDTO,
} from '@uaetrail/shared-types';
import {
  matchesExploreActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';
import { buildFriendActivityPresenceRows } from './friend-activity-presence.js';
import { enrichMemberPersonRows } from './member-people-engagement.js';

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

const tripSortRank = (trip: SocialPersonTripHintDTO | null): number => {
  if (!trip) return 0;
  return trip.role === 'hosting' ? 2 : 1;
};

/** All accepted friends — those hosting or joining an outing (date filter) sort to the top. */
export const buildMemberDiscoveryFriendsGoing = async (
  viewerUserId: string,
  friends: FriendSummaryDTO[],
  mapItems: ExploreMapItemDTO[],
  datePreset: ExploreActivityDatePreset
): Promise<SocialPersonRowDTO[]> => {
  const friendIds = new Set(friends.map((b) => b.userId));
  const presence = buildFriendActivityPresenceRows(friends, mapItems, datePreset);

  const itemByExploreId = new Map(mapItems.map((item) => [item.id, item]));

  const seeds = presence.map((row) => {
    const ref = row.hosting ?? row.joining;
    let upcomingTrip: SocialPersonTripHintDTO | null = null;

    if (ref) {
      const item = itemByExploreId.get(ref.exploreItemId);
      const role: SocialPersonTripHintDTO['role'] = row.hosting ? 'hosting' : 'joining';
      upcomingTrip =
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
    }

    return {
      userId: row.friend.userId,
      displayName: row.friend.displayName,
      avatarUrl: row.friend.avatarUrl,
      upcomingTrip,
    };
  });

  const rows = await enrichMemberPersonRows(viewerUserId, friendIds, seeds);
  return [...rows].sort((a, b) => {
    const rankDiff = tripSortRank(b.upcomingTrip) - tripSortRank(a.upcomingTrip);
    if (rankDiff !== 0) return rankDiff;
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
  });
};

/** Activity hosts on the map (non-friends) for the date filter. */
export const buildMemberDiscoveryHostsGoing = async (
  viewerUserId: string,
  friendIds: Set<string>,
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
    if (!hostId || hostId === viewerUserId || friendIds.has(hostId)) continue;

    const displayName = item.featuredPerson?.displayName ?? item.activity?.hostName ?? 'Host';
    if (needle && !displayName.toLowerCase().includes(needle) && !item.title?.toLowerCase().includes(needle)) {
      continue;
    }

    if (!hostByUserId.has(hostId)) {
      hostByUserId.set(hostId, {
        displayName,
        avatarUrl: item.featuredPerson?.avatarUrl ?? item.activity?.hostAvatar ?? null,
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

  const rows = await enrichMemberPersonRows(viewerUserId, friendIds, seeds);
  return [...rows].sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
};
