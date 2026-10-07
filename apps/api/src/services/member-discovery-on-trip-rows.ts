import type { ExploreMapItemDTO, MemberDiscoveryOnTripRowDTO } from '@uaetrail/shared-types';
import {
  matchesExploreActivityDateFilter,
  type ExploreActivityDatePreset,
} from '../lib/explore-activity-date-filter.js';

/** Strangers on published activities (legacy helper — tests / map tooling). */
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
