import { BWL_EXPLORE_MAP_SOURCE } from './wire-lexicon.js';

/** Map/list time-bound outings — hosted publish only on wire (`activityMode: seeking` is retired on the map). */
export type ExploreActivityMode = 'hosted' | 'seeking';

export type ExploreMapItemActivityModeFields = {
  source?: string;
  activityMode?: ExploreActivityMode | null;
  id?: string;
};

/** Resolve mode from wire fields — does not infer seeking from legacy `participantIntentId`. */
export const resolveExploreMapActivityMode = (
  item: ExploreMapItemActivityModeFields
): ExploreActivityMode | null => {
  if (item.activityMode === 'hosted' || item.activityMode === 'seeking') {
    return item.activityMode;
  }
  if (item.source === 'activity') return 'hosted';
  return null;
};

/**
 * Retired catalog row — published activities still stored as `activityMode: seeking`.
 * Excluded from `GET /explore/map`; use only to filter leftovers in client/tests.
 * Find crew on the map is {@link exploreMapItemIsAvailabilityCatalog} only.
 */
export const exploreMapItemIsLegacySeekingActivity = (
  item: ExploreMapItemActivityModeFields
): boolean => item.source === 'activity' && item.activityMode === 'seeking';

/** @deprecated Use {@link exploreMapItemIsLegacySeekingActivity} — not for Find crew UX. */
export const exploreMapItemIsSeeking = exploreMapItemIsLegacySeekingActivity;

/** Fixed crew availability on the explore catalog (`member_availability`, not `activities`). */
export const exploreMapItemIsAvailabilityCatalog = (
  item: ExploreMapItemActivityModeFields
): boolean =>
  item.source === BWL_EXPLORE_MAP_SOURCE.AVAILABILITY ||
  (item.id?.startsWith('availability:') ?? false);

export const exploreMapItemIsHostedActivity = (item: ExploreMapItemActivityModeFields): boolean =>
  resolveExploreMapActivityMode(item) === 'hosted';

/** Hosted activity, fixed availability, or excluded legacy seeking shape — not venues/shops. */
export const isTimeBoundExploreMapItem = (item: ExploreMapItemActivityModeFields): boolean =>
  exploreMapItemIsHostedActivity(item) ||
  exploreMapItemIsLegacySeekingActivity(item) ||
  exploreMapItemIsAvailabilityCatalog(item);