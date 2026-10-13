import {
  exploreMapItemIsHostedActivity,
  exploreMapItemIsSeeking,
  type ExploreActivityMode,
  type ExploreMapItemDTO,
} from '@uaetrail/shared-types';

export type ExploreActivityModeFilter = 'all' | ExploreActivityMode;

export const EXPLORE_ACTIVITY_MODE_FILTER_PARAM = 'activityMode';

export const parseExploreActivityModeFilter = (raw: string | null): ExploreActivityModeFilter => {
  const value = raw?.trim().toLowerCase();
  if (value === 'hosted' || value === 'seeking') return value;
  return 'all';
};

export const serializeExploreActivityModeFilter = (
  filter: ExploreActivityModeFilter
): string | null => (filter === 'all' ? null : filter);

export const exploreMapItemMatchesActivityModeFilter = (
  item: ExploreMapItemDTO,
  filter: ExploreActivityModeFilter
): boolean => {
  if (filter === 'all') return true;
  if (filter === 'seeking') return exploreMapItemIsSeeking(item);
  return exploreMapItemIsHostedActivity(item);
};
