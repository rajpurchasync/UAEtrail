import { EXPLORE_REGION_PILL_LABELS, getExploreRegionPillOptions } from '../../config/regions';
import { resolveExploreSearchDetectedWhereQuery } from './exploreSearchDetectedWhere';

const normalize = (value: string) => value.trim().toLowerCase();

export type ExploreSearchRegionPillRow = { key: string; label: string };

/** Map detected / typed emirate label → venue `regions` filter key (`Dubai`, `RAK`, …). */
export const resolveExploreSearchVenueRegionKeyFromLabel = (
  label: string,
  pillOptions: readonly ExploreSearchRegionPillRow[] = getExploreRegionPillOptions('AE')
): string | null => {
  const norm = normalize(label);
  const hit = pillOptions.find(
    (row) => row.key !== 'all' && (normalize(row.label) === norm || normalize(row.key) === norm)
  );
  return hit?.key ?? null;
};

export const resolveExploreSearchDefaultVenueRegions = (
  pillOptions: readonly ExploreSearchRegionPillRow[] = getExploreRegionPillOptions('AE')
): string[] => {
  const key = resolveExploreSearchVenueRegionKeyFromLabel(resolveExploreSearchDetectedWhereQuery(), pillOptions);
  return key ? [key] : [];
};

/** Hub places search — emirate picker summary (`All UAE` or emirate label). */
export const exploreSearchStateSummary = (
  regions: readonly string[],
  pillOptions: readonly ExploreSearchRegionPillRow[] = getExploreRegionPillOptions('AE')
): string => {
  if (regions.length === 0) return 'All UAE';
  return regions
    .map((key) => pillOptions.find((row) => row.key === key)?.label ?? EXPLORE_REGION_PILL_LABELS[key] ?? key)
    .join(', ');
};