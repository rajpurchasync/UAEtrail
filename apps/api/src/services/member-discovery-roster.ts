import { exploreMapItemIsAvailabilityCatalog } from '@uaetrail/shared-types';
import type {
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryAvailabilityRowDTO,
  MemberDiscoveryQuotaDTO,
  MemberDiscoveryRosterDTO,
} from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { listBuddiesForUser } from '../lib/buddy-store.js';
import { listFollowingForUser } from '../lib/follow-store.js';
import {
  matchesExploreActivityDateFilter,
  parseExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';
import { loadExploreMapItemsForMemberEngagement } from '../lib/explore-map-member-engagement.js';
import { enrichMemberBrowseDirectory } from './member-discovery-directory-enrich.js';
import { resolveCityLabelsForViewerBatch } from '../lib/find-crew-visibility-gate.js';
import {
  buildMemberDiscoveryFriendsGoing,
  buildMemberDiscoveryHostsGoing,
} from './member-discovery-going.js';
import { listBrowsablePublicMembers } from './member-discovery.js';
import { resolveMemberDiscoveryQuota } from './member-discovery-quota.js';
import { resolveMemberStatus } from './member-status.js';

const matchesMemberDiscoverySearch = (
  parts: Array<string | null | undefined>,
  search?: string
): boolean => {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  const haystack = parts.filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(needle);
};

/** Members with fixed availability pins on the explore map. */
export const buildMemberDiscoveryAvailabilityRowsFromMapItems = async (
  items: ExploreMapItemDTO[],
  input: {
    viewerUserId: string;
    excludeUserIds: Set<string>;
    datePreset: ExploreActivityDatePreset;
    search?: string;
    /** When set, only these member user ids pass find-crew visibility. */
    findCrewVisibleUserIds?: ReadonlySet<string>;
  }
): Promise<MemberDiscoveryAvailabilityRowDTO[]> => {
  const seen = new Set<string>();
  const rows: MemberDiscoveryAvailabilityRowDTO[] = [];

  for (const item of items) {
    if (!exploreMapItemIsAvailabilityCatalog(item)) continue;
    if (!matchesExploreActivityDateFilter(item, input.datePreset)) continue;
    if (item.viewerAccess?.exposure === 'none') continue;

    const userId = item.featuredPerson?.userId ?? null;
    if (!userId || input.excludeUserIds.has(userId) || seen.has(userId)) continue;
    if (input.findCrewVisibleUserIds && !input.findCrewVisibleUserIds.has(userId)) continue;

    const displayName =
      item.featuredPerson?.displayName ?? item.subtitle ?? 'Member';
    const availabilityTitle = item.title?.trim() || 'Available to go together';
    if (
      !matchesMemberDiscoverySearch([displayName, availabilityTitle, item.subtitle ?? null], input.search)
    ) {
      continue;
    }

    seen.add(userId);
    rows.push({
      userId,
      displayName,
      avatarUrl: item.featuredPerson?.avatarUrl ?? null,
      availabilityTitle,
      exploreItemId: item.id,
    });
  }

  return rows;
};

const buildFollowedBrowseCards = async (
  viewerUserId: string,
  buddyIds: Set<string>,
  search?: string
): Promise<MemberBrowseCardDTO[]> => {
  const following = await listFollowingForUser(viewerUserId);
  const rows = following.filter((row) => !buddyIds.has(row.userId));
  const filtered = rows.filter((row) =>
    matchesMemberDiscoverySearch([row.displayName], search)
  );
  return filtered.map((row) => ({
    id: row.userId,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    city: null,
  }));
};

export const loadMemberDiscoveryRoster = async (input: {
  viewerUserId: string;
  userRole?: string | null;
  datePresetRaw?: string | null;
  search?: string;
  skip: number;
  take: number;
  omitDirectory?: boolean;
}): Promise<{
  data: MemberDiscoveryRosterDTO & { directory: MemberBrowseCardDTO[] };
  quota: MemberDiscoveryQuotaDTO;
}> => {
  const datePreset = parseExploreActivityDatePreset(input.datePresetRaw);
  const [hostStatus, mapItems, buddies] = await Promise.all([
    resolveMemberStatus(input.viewerUserId),
    loadExploreMapItemsForMemberEngagement({
      viewerUserId: input.viewerUserId,
      userRole: input.userRole,
    }),
    listBuddiesForUser(input.viewerUserId),
  ]);
  const quota = await resolveMemberDiscoveryQuota(input.viewerUserId, hostStatus);

  const excludeUserIds = new Set<string>([input.viewerUserId]);
  const buddyIds = new Set<string>();
  for (const buddy of buddies) {
    if (buddy.userId) {
      excludeUserIds.add(buddy.userId);
      buddyIds.add(buddy.userId);
    }
  }

  const directoryPromise = input.omitDirectory
    ? Promise.resolve([] as MemberBrowseCardDTO[])
    : listBrowsablePublicMembers({
        excludeUserId: input.viewerUserId,
        excludeUserIds,
        search: input.search,
        skip: input.skip,
        take: input.take,
      }).then((directoryRaw) => enrichMemberBrowseDirectory(input.viewerUserId, directoryRaw));

  const directory = await directoryPromise;

  const followedPromise = buildFollowedBrowseCards(input.viewerUserId, buddyIds, input.search).then(
    async (followedRaw) => {
      const followedUsers = await findAuthUsersByIds(followedRaw.map((card) => card.id));
      const userById = new Map(followedUsers.map((user) => [user._id, user] as const));
      const cityByUserId = await resolveCityLabelsForViewerBatch(
        // Cards without a loaded user record have no city to gate — they fall back to `null` below.
        followedRaw.flatMap((card) => {
          const user = userById.get(card.id);
          if (!user) return [];
          const rawCity = user.profile?.city;
          const cityLabel = rawCity ? USER_CITY_LABELS[rawCity as UserCity] ?? null : null;
          return [{ subject: user, cityLabel }];
        }),
        input.viewerUserId,
        { viewerBuddyIds: buddyIds }
      );
      const followedWithCity = followedRaw.map((card) => ({
        ...card,
        city: cityByUserId.get(card.id) ?? null,
      }));
      return enrichMemberBrowseDirectory(input.viewerUserId, followedWithCity);
    }
  );

  // Map items already passed find-crew filtering in enrichExploreMapPayloadViewerAccess.
  const availabilityOnMapPromise = buildMemberDiscoveryAvailabilityRowsFromMapItems(mapItems, {
    viewerUserId: input.viewerUserId,
    excludeUserIds,
    datePreset,
    search: input.search,
  });

  const [friendsGoing, hostsGoing, availabilityOnMap, followed] = await Promise.all([
    buildMemberDiscoveryFriendsGoing(input.viewerUserId, buddies, mapItems, datePreset),
    buildMemberDiscoveryHostsGoing(
      input.viewerUserId,
      buddyIds,
      mapItems,
      datePreset,
      input.search
    ),
    availabilityOnMapPromise,
    followedPromise,
  ]);

  const friendsFiltered = friendsGoing.filter((row) =>
    matchesMemberDiscoverySearch(
      [row.displayName, row.upcomingTrip?.title ?? null, row.cityLabel],
      input.search
    )
  );

  return {
    data: { friendsGoing: friendsFiltered, hostsGoing, availabilityOnMap, followed, directory },
    quota,
  };
};
