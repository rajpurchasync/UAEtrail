import { exploreMapItemIsSeeking } from '@uaetrail/shared-types';
import type {
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoverySeekingRowDTO,
  MemberDiscoveryQuotaDTO,
  MemberDiscoveryRosterDTO,
} from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { findAuthUsersByIds } from '../lib/auth-users.js';
import { listBuddiesForUser } from '../lib/buddy-store.js';
import { listFollowingForUser } from '../lib/follow-store.js';
import {
  matchesExploreActivityDateFilter,
  parseExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';
import { loadExploreMapItemsForMemberEngagement } from '../lib/explore-map-member-engagement.js';
import { enrichMemberBrowseDirectory } from './member-discovery-directory-enrich.js';
import {
  buildMemberDiscoveryFriendsGoing,
  buildMemberDiscoveryHostsGoing,
} from './member-discovery-going.js';
import { listBrowsablePublicMembers } from './member-discovery.js';
import { resolveMemberDiscoveryQuota } from './member-discovery-quota.js';
import { resolveMemberHostStatus } from './member-host-status.js';

const matchesMemberDiscoverySearch = (
  parts: Array<string | null | undefined>,
  search?: string
): boolean => {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  const haystack = parts.filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(needle);
};

/** Members with active seeking posts on the explore map. */
export const buildMemberDiscoverySeekingRowsFromMapItems = (
  items: ExploreMapItemDTO[],
  input: {
    viewerUserId: string;
    excludeUserIds: Set<string>;
    datePreset: ExploreActivityDatePreset;
    search?: string;
  }
): MemberDiscoverySeekingRowDTO[] => {
  const seen = new Set<string>();
  const rows: MemberDiscoverySeekingRowDTO[] = [];

  for (const item of items) {
    if (!exploreMapItemIsSeeking(item)) continue;
    if (!matchesExploreActivityDateFilter(item, input.datePreset)) continue;
    if (item.viewerAccess?.exposure === 'none') continue;

    const userId = item.featuredPerson?.userId ?? item.requesterUserId ?? null;
    if (!userId || input.excludeUserIds.has(userId) || seen.has(userId)) continue;

    const displayName =
      item.featuredPerson?.displayName ?? item.hostName ?? 'Member';
    const seekingTitle = item.title?.trim() || 'Looking for company';
    if (
      !matchesMemberDiscoverySearch([displayName, seekingTitle, item.subtitle ?? null], input.search)
    ) {
      continue;
    }

    const intentId = item.participantIntentId ?? item.id.replace(/^demand:/, '');
    seen.add(userId);
    rows.push({
      userId,
      displayName,
      avatarUrl: item.featuredPerson?.avatarUrl ?? item.hostAvatar ?? null,
      participantIntentId: intentId,
      seekingTitle,
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
    resolveMemberHostStatus(input.viewerUserId),
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
      const followedWithCity = followedRaw.map((card) => {
        const user = followedUsers.find((u) => u._id === card.id);
        const city = user?.profile?.city;
        return {
          ...card,
          city: city ? USER_CITY_LABELS[city as UserCity] ?? null : null,
        };
      });
      return enrichMemberBrowseDirectory(input.viewerUserId, followedWithCity);
    }
  );

  const [friendsGoing, hostsGoing, seekingOnMap, followed] = await Promise.all([
    buildMemberDiscoveryFriendsGoing(input.viewerUserId, buddies, mapItems, datePreset),
    buildMemberDiscoveryHostsGoing(
      input.viewerUserId,
      buddyIds,
      mapItems,
      datePreset,
      input.search
    ),
    Promise.resolve(
      buildMemberDiscoverySeekingRowsFromMapItems(mapItems, {
        viewerUserId: input.viewerUserId,
        excludeUserIds,
        datePreset,
        search: input.search,
      })
    ),
    followedPromise,
  ]);

  const friendsFiltered = friendsGoing.filter((row) =>
    matchesMemberDiscoverySearch(
      [row.displayName, row.upcomingTrip?.title ?? null, row.cityLabel],
      input.search
    )
  );

  return {
    data: { friendsGoing: friendsFiltered, hostsGoing, seekingOnMap, followed, directory },
    quota,
  };
};
