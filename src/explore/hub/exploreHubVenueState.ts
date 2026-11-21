import { EXPLORE_REGION_PILL_LABELS, getExploreRegionPillOptions } from '../../config/regions';
import { resolveExploreHubDetectedWhereQuery } from './exploreHubDetectedWhere';

const normalize = (value: string) => value.trim().toLowerCase();

export type ExploreHubRegionPillRow = { key: string; label: string };

/** Map detected / typed emirate label → venue `regions` filter key (`Dubai`, `RAK`, …). */
export const resolveExploreHubVenueRegionKeyFromLabel = (
  label: string,
  pillOptions: readonly ExploreHubRegionPillRow[] = getExploreRegionPillOptions('AE')
): string | null => {
  const norm = normalize(label);
  const hit = pillOptions.find(
    (row) => row.key !== 'all' && (normalize(row.label) === norm || normalize(row.key) === norm)
  );
  return hit?.key ?? null;
};

export const resolveExploreHubDefaultVenueRegions = (
  pillOptions: readonly ExploreHubRegionPillRow[] = getExploreRegionPillOptions('AE')
): string[] => {
  const key = resolveExploreHubVenueRegionKeyFromLabel(resolveExploreHubDetectedWhereQuery(), pillOptions);
  return key ? [key] : [];
};

/** Hub places search — emirate picker summary (`All UAE` or emirate label). */
export const exploreHubHomeStateSummary = (
  regions: readonly string[],
  pillOptions: readonly ExploreHubRegionPillRow[] = getExploreRegionPillOptions('AE')
): string => {
  if (regions.length === 0) return 'All UAE';
  return regions
    .map((key) => pillOptions.find((row) => row.key === key)?.label ?? EXPLORE_REGION_PILL_LABELS[key] ?? key)
    .join(', ');
};