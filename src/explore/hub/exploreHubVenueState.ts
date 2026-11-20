import { EXPLORE_REGION_PILL_LABELS, getExploreRegionPillOptions } from '../../config/regions';
import { resolveExploreHubDetectedWhereQuery } from './exploreHubDetectedWhere';

const normalize = (value: string) => value.trim().toLowerCase();

/** Map detected / typed emirate label → venue `regions` filter key (`Dubai`, `RAK`, …). */
export const resolveExploreHubVenueRegionKeyFromLabel = (label: string): string | null => {
  const options = getExploreRegionPillOptions('AE');
  const norm = normalize(label);
  const hit = options.find(
    (row) => row.key !== 'all' && (normalize(row.label) === norm || normalize(row.key) === norm)
  );
  return hit?.key ?? null;
};

export const resolveExploreHubDefaultVenueRegions = (): string[] => {
  const key = resolveExploreHubVenueRegionKeyFromLabel(resolveExploreHubDetectedWhereQuery());
  return key ? [key] : [];
};

/** Hub places search — emirate picker summary (`All UAE` or emirate label). */
export const exploreHubHomeStateSummary = (regions: readonly string[]): string => {
  if (regions.length === 0) return 'All UAE';
  const options = getExploreRegionPillOptions('AE');
  return regions
    .map((key) => options.find((row) => row.key === key)?.label ?? EXPLORE_REGION_PILL_LABELS[key] ?? key)
    .join(', ');
};