import { BWL_EXPLORE_MAP_SOURCE } from './wire-lexicon.js';

/** Map/list time-bound outings — hosted publish only on wire. */
export type ExploreActivityMode = 'hosted';

export type ExploreMapItemActivityModeFields = {
  source?: string;
  activityMode?: ExploreActivityMode | null;
  /** @deprecated Legacy Mongo — never emitted on API wire; used only to filter leftovers in catalog. */
  id?: string;
};

/** Legacy Mongo value — not product wire; centralized for guards and purge residue checks. */
export const RETIRED_SEEKING_ACTIVITY_MODE = 'seeking' as const;

export type RetiredSeekingActivityModeWire = typeof RETIRED_SEEKING_ACTIVITY_MODE;

export const isRetiredSeekingActivityModeValue = (mode: unknown): mode is RetiredSeekingActivityModeWire =>
  mode === RETIRED_SEEKING_ACTIVITY_MODE;

/** Legacy DB rows may still store `activityMode: seeking` until purge migration runs. */
const isRetiredSeekingActivityMode = (item: { activityMode?: string | null }) =>
  isRetiredSeekingActivityModeValue(item.activityMode);

/** Resolve mode from wire fields — does not infer seeking from legacy ids. */
export const resolveExploreMapActivityMode = (
  item: ExploreMapItemActivityModeFields
): ExploreActivityMode | null => {
  if (isRetiredSeekingActivityMode(item)) return null;
  if (item.activityMode === 'hosted') return 'hosted';
  if (item.source === 'activity') return 'hosted';
  return null;
};

/**
 * Retired catalog row — excluded from `GET /explore/map`.
 * Find crew on the map is {@link exploreMapItemIsAvailabilityCatalog} only.
 */
export const exploreMapItemIsRetiredSeekingActivity = (
  item: ExploreMapItemActivityModeFields
): boolean => item.source === 'activity' && isRetiredSeekingActivityMode(item);

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
  exploreMapItemIsRetiredSeekingActivity(item) ||
  exploreMapItemIsAvailabilityCatalog(item);