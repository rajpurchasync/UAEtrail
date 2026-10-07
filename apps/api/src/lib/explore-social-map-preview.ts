import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { resolveExploreFeaturedPerson } from '@uaetrail/shared-types';

export type ExploreSocialMapPreviewPerson = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

const CHIP_LIMIT = 12;

const activityJoinCount = (item: ExploreMapItemDTO): number => {
  if (item.slotsTotal != null && item.slotsAvailable != null) {
    return Math.max(0, item.slotsTotal - item.slotsAvailable);
  }
  return item.participantPreviews?.length ?? 0;
};

/** Participant + host faces from explore map items (map Social pill). */
export const collectExploreSocialMapPreviewPeople = (
  items: ExploreMapItemDTO[],
  excludeUserId: string
): ExploreSocialMapPreviewPerson[] => {
  const activities = items
    .filter((item) => item.source === 'activity' || item.source === 'demand')
    .filter(
      (item) =>
        activityJoinCount(item) > 0 ||
        (item.participantPreviews?.length ?? 0) > 0 ||
        Boolean(resolveExploreFeaturedPerson(item))
    )
    .sort((a, b) => activityJoinCount(b) - activityJoinCount(a));

  const seen = new Set<string>();
  const rows: ExploreSocialMapPreviewPerson[] = [];

  const push = (userId: string, displayName: string, avatarUrl: string | null | undefined) => {
    if (!userId || userId === excludeUserId || seen.has(userId)) return;
    seen.add(userId);
    rows.push({
      userId,
      displayName: displayName.trim() || 'Member',
      avatarUrl: avatarUrl ?? null,
    });
  };

  for (const item of activities) {
    for (const preview of item.participantPreviews ?? []) {
      push(preview.id, preview.name, preview.avatar);
      if (rows.length >= CHIP_LIMIT) return rows;
    }
    if ((item.participantPreviews ?? []).length === 0) {
      const featured = resolveExploreFeaturedPerson(item);
      if (featured) push(featured.userId, featured.displayName, featured.avatarUrl);
      if (rows.length >= CHIP_LIMIT) return rows;
    }
  }

  return rows;
};
