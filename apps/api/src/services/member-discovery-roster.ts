import type {
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryLookingRowDTO,
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
import { buildExploreMapPayload } from '../lib/explore-map.js';
import { enrichExploreMapPayloadViewerAccess } from '../lib/explore-map-viewer-access.js';
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

/** Members with active demand posts on the explore map. */
export const buildMemberDiscoveryLookingRowsFromMapItems = (
  items: ExploreMapItemDTO[],
  input: {
    viewerUserId: string;
    excludeUserIds: Set<string>;
    datePreset: ExploreActivityDatePreset;
    search?: string;
  }
): MemberDiscoveryLookingRowDTO[] => {
  const seen = new Set<string>();
  const rows: MemberDiscoveryLookingRowDTO[] = [];

  for (const item of items) {
    if (item.source !== 'demand') continue;
    if (!matchesExploreActivityDateFilter(item, input.datePreset)) continue;
    if (item.viewerAccess?.exposure === 'none') continue;

    const userId = item.featuredPerson?.userId ?? item.requesterUserId ?? null;
    if (!userId || input.excludeUserIds.has(userId) || seen.has(userId)) continue;

    const displayName =
      item.featuredPerson?.displayName ?? item.hostName ?? 'Member';
    const demandTitle = item.title?.trim() || 'Looking for company';
    if (
      !matchesMemberDiscoverySearch([displayName, demandTitle, item.subtitle ?? null], input.search)
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
      demandTitle,
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
}): Promise<{
  data: MemberDiscoveryRosterDTO & { directory: MemberBrowseCardDTO[] };
  quota: MemberDiscoveryQuotaDTO;
}> => {
  const datePreset = parseExploreActivityDatePreset(input.datePresetRaw);
  const hostStatus = await resolveMemberHostStatus(input.viewerUserId);
  const [payload, buddies, quota] = await Promise.all([
    buildExploreMapPayload(),
    listBuddiesForUser(input.viewerUserId),
    resolveMemberDiscoveryQuota(input.viewerUserId, hostStatus),
  ]);

  const excludeUserIds = new Set<string>([input.viewerUserId]);
  const buddyIds = new Set<string>();
  for (const buddy of buddies) {
    if (buddy.userId) {
      excludeUserIds.add(buddy.userId);
      buddyIds.add(buddy.userId);
    }
  }

  const directoryRaw = await listBrowsablePublicMembers({
    excludeUserId: input.viewerUserId,
    excludeUserIds,
    search: input.search,
    skip: input.skip,
    take: input.take,
  });
  const directory = await enrichMemberBrowseDirectory(input.viewerUserId, directoryRaw);

  const enriched = await enrichExploreMapPayloadViewerAccess(payload, {
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
  });

  const [friendsGoing, hostsGoing] = await Promise.all([
    buildMemberDiscoveryFriendsGoing(input.viewerUserId, buddies, enriched.items, datePreset),
    buildMemberDiscoveryHostsGoing(
      input.viewerUserId,
      buddyIds,
      enriched.items,
      datePreset,
      input.search
    ),
  ]);

  const friendsFiltered = friendsGoing.filter((row) =>
    matchesMemberDiscoverySearch(
      [row.displayName, row.upcomingTrip?.title ?? null, row.cityLabel],
      input.search
    )
  );

  const lookingFor = buildMemberDiscoveryLookingRowsFromMapItems(enriched.items, {
    viewerUserId: input.viewerUserId,
    excludeUserIds,
    datePreset,
    search: input.search,
  });

  const followedRaw = await buildFollowedBrowseCards(input.viewerUserId, buddyIds, input.search);
  const followedUsers = await findAuthUsersByIds(followedRaw.map((card) => card.id));
  const followedWithCity = followedRaw.map((card) => {
    const user = followedUsers.find((u) => u._id === card.id);
    const city = user?.profile?.city;
    return {
      ...card,
      city: city ? USER_CITY_LABELS[city as UserCity] ?? null : null,
    };
  });
  const followed = await enrichMemberBrowseDirectory(input.viewerUserId, followedWithCity);

  return {
    data: { friendsGoing: friendsFiltered, hostsGoing, lookingFor, followed, directory },
    quota,
  };
};
