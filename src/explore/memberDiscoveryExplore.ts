import type {
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryOnTripRowDTO,
} from '@uaetrail/shared-types';

/** Profile open from Explore Discover segment (`from=discover` on API). */
export const memberDiscoverProfilePath = (userId: string): string =>
  `/member/${userId}?discover=1&source=discover`;

/** Client-side fallback when map items are already loaded (tests). */
export const buildMemberDiscoveryOnTripRowsFromMapItems = (
  activities: ExploreMapItemDTO[],
  excludeUserIds: Set<string>
): MemberDiscoveryOnTripRowDTO[] => {
  const seen = new Set<string>();
  const rows: MemberDiscoveryOnTripRowDTO[] = [];

  for (const item of activities) {
    if (item.source !== 'activity' || !item.activity) continue;
    const activityId = item.activity.id;
    const activityTitle = item.activity.title ?? item.title ?? 'Outing';
    for (const preview of item.participantPreviews ?? []) {
      const userId = preview.id;
      if (!userId || excludeUserIds.has(userId) || seen.has(userId)) continue;
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

export const filterDiscoverDirectory = (
  directory: MemberBrowseCardDTO[],
  excludeUserIds: Set<string>,
  query: string
): MemberBrowseCardDTO[] => {
  const q = query.trim().toLowerCase();
  return directory.filter((card) => {
    if (excludeUserIds.has(card.id)) return false;
    if (!q) return true;
    return card.displayName.toLowerCase().includes(q);
  });
};
