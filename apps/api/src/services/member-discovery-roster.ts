import type {
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryOnTripRowDTO,
  MemberDiscoveryQuotaDTO,
  MemberDiscoveryRosterDTO,
} from '@uaetrail/shared-types';
import { findAuthUsersByIds } from '../lib/auth-users.js';
import { listBuddiesForUser } from '../lib/buddy-store.js';
import {
  matchesExploreActivityDateFilter,
  parseExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';
import { buildExploreMapPayload } from '../lib/explore-map.js';
import { enrichExploreMapPayloadViewerAccess } from '../lib/explore-map-viewer-access.js';
import { normalizeProfileVisibility } from '../lib/media-access.js';
import { listBrowsablePublicMembers } from './member-discovery.js';
import { resolveMemberDiscoveryQuota } from './member-discovery-quota.js';
import { resolveMemberHostStatus } from './member-host-status.js';
import { shouldHideFromMapMemberDiscovery } from './profile-viewer-access.js';

const isPublicProfile = (profileVisibility: unknown): boolean =>
  normalizeProfileVisibility(profileVisibility) === 'public';

/** Strangers on published activities (explore map participant previews + public profile rules). */
export const buildMemberDiscoveryOnTripRowsFromMapItems = (
  items: ExploreMapItemDTO[],
  input: {
    viewerUserId: string;
    excludeUserIds: Set<string>;
    datePreset: ExploreActivityDatePreset;
    discoverableUserIds: Set<string>;
  }
): MemberDiscoveryOnTripRowDTO[] => {
  const seen = new Set<string>();
  const rows: MemberDiscoveryOnTripRowDTO[] = [];

  for (const item of items) {
    if (item.source !== 'activity' || !item.activity) continue;
    if (!matchesExploreActivityDateFilter(item, input.datePreset)) continue;
    if (item.viewerAccess?.exposure === 'none') continue;

    const activityId = item.activity.id;
    const activityTitle = item.activity.title ?? item.title ?? 'Outing';
    const hostUserId =
      item.activity.hostId ?? item.activity.hostUserId ?? item.activity.createdById ?? null;

    for (const preview of item.participantPreviews ?? []) {
      const userId = preview.id;
      if (!userId || input.excludeUserIds.has(userId) || userId === hostUserId) continue;
      if (!input.discoverableUserIds.has(userId) || seen.has(userId)) continue;
      seen.add(userId);
      rows.push({
        userId,
        displayName: preview.name || 'Member',
        avatarUrl: preview.avatar ?? null,
        activityId,
        activityTitle,
      });
    }
  }

  return rows;
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
  for (const buddy of buddies) {
    if (buddy.userId) excludeUserIds.add(buddy.userId);
  }

  const directory = await listBrowsablePublicMembers({
    excludeUserId: input.viewerUserId,
    excludeUserIds,
    search: input.search,
    skip: input.skip,
    take: input.take,
  });

  const enriched = await enrichExploreMapPayloadViewerAccess(payload, {
    viewerUserId: input.viewerUserId,
    userRole: input.userRole,
  });

  const candidateUserIds = new Set<string>();
  for (const item of enriched.items) {
    if (item.source !== 'activity') continue;
    for (const preview of item.participantPreviews ?? []) {
      if (preview.id && !excludeUserIds.has(preview.id)) {
        candidateUserIds.add(preview.id);
      }
    }
  }

  const users = await findAuthUsersByIds([...candidateUserIds]);
  const publicUsers = users.filter((user) => isPublicProfile(user.profile?.profileVisibility));
  const hideFlags = await Promise.all(
    publicUsers.map(async (user) => ({
      id: user._id,
      hide: await shouldHideFromMapMemberDiscovery(user._id, user.profile?.profileVisibility),
    }))
  );
  const discoverableUserIds = new Set(
    hideFlags.filter((row) => !row.hide).map((row) => row.id)
  );

  const onTrips = buildMemberDiscoveryOnTripRowsFromMapItems(enriched.items, {
    viewerUserId: input.viewerUserId,
    excludeUserIds,
    datePreset,
    discoverableUserIds,
  });

  return {
    data: { onTrips, directory },
    quota,
  };
};
