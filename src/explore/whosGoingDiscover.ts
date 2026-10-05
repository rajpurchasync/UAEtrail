import type { ExploreMapItemDTO, MemberBrowseCardDTO } from '@uaetrail/shared-types';

export type WhosGoingDiscoverTripRow = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  activityId: string;
  activityTitle: string;
};

/** Non-buddy participants visible on current map activities (client-side; profile open is server-gated). */
export const buildDiscoverPeopleOnTrips = (
  activities: ExploreMapItemDTO[],
  excludeUserIds: Set<string>
): WhosGoingDiscoverTripRow[] => {
  const seen = new Set<string>();
  const rows: WhosGoingDiscoverTripRow[] = [];

  for (const item of activities) {
    if (item.source !== 'activity' || !item.activity) continue;
    const activityId = item.id;
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
