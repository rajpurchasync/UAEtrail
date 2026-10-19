/** Map/list time-bound outings — hosted publish vs member seeking (M0 projection). */
export type ExploreActivityMode = 'hosted' | 'seeking';

export type ExploreMapItemActivityModeFields = {
  source?: string;
  activityMode?: ExploreActivityMode | null;
  participantIntentId?: string | null;
  id?: string;
};

/** Resolve mode from wire fields (`activityMode`, else hosted activity). */
export const resolveExploreMapActivityMode = (
  item: ExploreMapItemActivityModeFields
): ExploreActivityMode | null => {
  if (item.activityMode === 'hosted' || item.activityMode === 'seeking') {
    return item.activityMode;
  }
  if (item.source === 'activity' && item.participantIntentId) return 'seeking';
  if (item.source === 'activity') return 'hosted';
  return null;
};

export const exploreMapItemIsSeeking = (item: ExploreMapItemActivityModeFields): boolean =>
  resolveExploreMapActivityMode(item) === 'seeking';

export const exploreMapItemIsHostedActivity = (item: ExploreMapItemActivityModeFields): boolean =>
  resolveExploreMapActivityMode(item) === 'hosted';

/** Hosted or seeking — excludes venues, shops, agencies. */
export const isTimeBoundExploreMapItem = (item: ExploreMapItemActivityModeFields): boolean =>
  resolveExploreMapActivityMode(item) !== null;
