import { ApiError } from '../lib/api-error.js';
import { listFriendsForUser } from '../lib/friend-store.js';
import {
  countMemberProfileViewsSince,
  countUniqueMemberProfileViewersSince,
} from '../lib/member-profile-views-store.js';
import { listBrowsablePublicMembers } from './member-discovery.js';
import { maySeeProfileViewStats } from './member-entitlements.js';
import type { HostStatusDTO } from '@uaetrail/shared-types';

const PROFILE_VIEW_STATS_WINDOW_DAYS = 30;

export const listBrowsableMembersForViewer = async (input: {
  viewerUserId: string;
  search?: string;
  skip: number;
  take: number;
}) => {
  const buddies = await listFriendsForUser(input.viewerUserId);
  const excludeUserIds = new Set<string>([input.viewerUserId]);
  for (const buddy of buddies) {
    if (buddy.userId) excludeUserIds.add(buddy.userId);
  }
  return listBrowsablePublicMembers({
    excludeUserId: input.viewerUserId,
    excludeUserIds,
    search: input.search,
    skip: input.skip,
    take: input.take,
  });
};

export const loadMyProfileViewStats = async (input: {
  viewerUserId: string;
  hostStatus: HostStatusDTO;
}) => {
  if (!maySeeProfileViewStats({ viewerUserId: input.viewerUserId, hostStatus: input.hostStatus })) {
    throw new ApiError(
      403,
      'upgrade_required',
      'Profile view stats are available on Pro and business memberships.'
    );
  }

  const since = new Date(Date.now() - PROFILE_VIEW_STATS_WINDOW_DAYS * 86_400_000);
  const [totalViews, uniqueViewers] = await Promise.all([
    countMemberProfileViewsSince(input.viewerUserId, since),
    countUniqueMemberProfileViewersSince(input.viewerUserId, since),
  ]);

  return {
    windowDays: PROFILE_VIEW_STATS_WINDOW_DAYS,
    totalViews,
    uniqueViewers,
  };
};
