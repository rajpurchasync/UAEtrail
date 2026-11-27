import type {
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  MemberDiscoveryRosterDTO,
} from '@uaetrail/shared-types';
import { buildMemberDiscoveryQuota } from '@uaetrail/shared-types';
import { USER_CITY_LABELS, type UserCity } from '../domain/user-profile.js';
import { findAuthUsersByIds } from '../lib/auth-users-store.js';
import { listFriendsForUser } from '../lib/friend-store.js';
import { listFollowingForUser } from '../lib/follow-store.js';
import { parseExploreActivityDatePreset } from '../lib/explore-activity-date-filter.js';
import { loadExploreMapItemsForMemberEngagement } from '../lib/explore-map-member-engagement.js';
import { enrichMemberBrowseDirectory } from './member-discovery-directory-enrich.js';
import { resolveCityLabelsForViewerBatch } from '../lib/find-crew-visibility-gate.js';
import {
  buildMemberDiscoveryFriendsGoing,
  buildMemberDiscoveryHostsGoing,
} from './member-discovery-going.js';
import { listBrowsablePublicMembers } from './member-discovery.js';
import { resolveMemberDiscoveryQuota } from './member-discovery-quota.js';
import { loadDiscoverCrewAvailabilityRows } from './discover-crew-availability-rows.js';
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

const buildFollowedBrowseCards = async (
  viewerUserId: string,
  friendIds: Set<string>,
  search?: string
): Promise<MemberBrowseCardDTO[]> => {
  const following = await listFollowingForUser(viewerUserId);
  const rows = following.filter((row) => !friendIds.has(row.userId));
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
  viewerUserId: string | null;
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
  if (!input.viewerUserId) {
    const directory = input.omitDirectory
      ? ([] as MemberBrowseCardDTO[])
      : await listBrowsablePublicMembers({
          excludeUserId: null,
          search: input.search,
          skip: input.skip,
          take: input.take,
        }).then((raw) => enrichMemberBrowseDirectory(null, raw));
    return {
      data: {
        friendsGoing: [],
        hostsGoing: [],
        availabilityOnMap: [],
        followed: [],
        directory,
      },
      quota: buildMemberDiscoveryQuota(0, false),
    };
  }

  const datePreset = parseExploreActivityDatePreset(input.datePresetRaw);
  const [hostStatus, mapItems, friends] = await Promise.all([
    resolveMemberStatus(input.viewerUserId),
    loadExploreMapItemsForMemberEngagement({
      viewerUserId: input.viewerUserId,
      userRole: input.userRole,
    }),
    listFriendsForUser(input.viewerUserId),
  ]);
  const quota = await resolveMemberDiscoveryQuota(input.viewerUserId, hostStatus);

  const excludeUserIds = new Set<string>([input.viewerUserId]);
  const friendIds = new Set<string>();
  for (const friend of friends) {
    if (friend.userId) {
      excludeUserIds.add(friend.userId);
      friendIds.add(friend.userId);
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

  const followedPromise = buildFollowedBrowseCards(input.viewerUserId, friendIds, input.search).then(
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
        { viewerFriendIds: friendIds }
      );
      const followedWithCity = followedRaw.map((card) => ({
        ...card,
        city: cityByUserId.get(card.id) ?? null,
      }));
      return enrichMemberBrowseDirectory(input.viewerUserId, followedWithCity);
    }
  );

  const availabilityOnMapPromise = loadDiscoverCrewAvailabilityRows({
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
    excludeUserIds,
    datePreset,
    search: input.search,
  });

  const [friendsGoing, hostsGoing, availabilityOnMap, followed] = await Promise.all([
    buildMemberDiscoveryFriendsGoing(input.viewerUserId, friends, mapItems, datePreset),
    buildMemberDiscoveryHostsGoing(
      input.viewerUserId,
      friendIds,
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
