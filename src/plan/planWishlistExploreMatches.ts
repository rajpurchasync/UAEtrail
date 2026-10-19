import type { ExploreMapItemDTO, WishlistItemDTO } from '@uaetrail/shared-types';
import { exploreMapItemIsSeeking } from '@uaetrail/shared-types';
import { wishlistItemTitle } from '../member-plan/wishlistSavedItem';

export type PlanWishlistSuggestion = {
  wishlistItemId: string;
  title: string;
  href: string;
  subtitle?: string | null;
};

const todayStart = () => new Date(new Date().toDateString());

const isUpcomingMapItem = (
  item: ExploreMapItemDTO,
  joinedActivityIds: ReadonlySet<string>
): boolean => {
  if (exploreMapItemIsSeeking(item)) {
    return !item.convertedActivityId;
  }
  const activity = item.activity;
  if (!activity || activity.status !== 'published') return false;
  if (joinedActivityIds.has(activity.id)) return false;
  return new Date(activity.date) >= todayStart();
};

const mapItemMatchesSavedActivity = (item: ExploreMapItemDTO, activityId: string): boolean =>
  item.activity?.id === activityId || item.id === `activity:${activityId}`;

const mapItemMatchesSavedPlace = (item: ExploreMapItemDTO, locationId: string): boolean => {
  if (item.id === `venue:${locationId}`) return true;
  return item.activity?.locationId === locationId;
};

/** Map saved wishlist rows to live explore items the member can open on the map. */
export const planWishlistExploreMatches = (
  wishlist: WishlistItemDTO[],
  mapItems: ExploreMapItemDTO[],
  joinedActivityIds: ReadonlySet<string> = new Set(),
  max = 6
): PlanWishlistSuggestion[] => {
  const eligible = mapItems.filter((item) => isUpcomingMapItem(item, joinedActivityIds));
  const usedExploreIds = new Set<string>();
  const suggestions: PlanWishlistSuggestion[] = [];

  for (const save of wishlist) {
    const activityId = save.activityId ?? save.activity?.id ?? null;
    const locationId = save.locationId ?? save.location?.id ?? null;

    let match: ExploreMapItemDTO | undefined;
    if (activityId) {
      match = eligible.find(
        (item) => !usedExploreIds.has(item.id) && mapItemMatchesSavedActivity(item, activityId)
      );
    } else if (locationId) {
      match = eligible.find(
        (item) => !usedExploreIds.has(item.id) && mapItemMatchesSavedPlace(item, locationId)
      );
    }

    if (!match) continue;
    usedExploreIds.add(match.id);
    suggestions.push({
      wishlistItemId: save.id,
      title: wishlistItemTitle(save),
      href: match.path,
      subtitle: match.subtitle ?? match.activity?.locationName ?? null,
    });
    if (suggestions.length >= max) break;
  }

  return suggestions;
};
