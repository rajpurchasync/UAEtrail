import type { BrowseListFilterState } from '../browseListFilters';
import type { BrowseListBucket } from './browseListBucket';

export const LIST_LAYOUT_PARAM = 'layout';

export type BrowseListLayout = 'thumbnails' | 'list' | 'calendar';

const LAYOUTS = new Set<BrowseListLayout>(['thumbnails', 'list', 'calendar']);

export const parseBrowseListLayout = (value: string | null): BrowseListLayout => {
  if (value && LAYOUTS.has(value as BrowseListLayout)) return value as BrowseListLayout;
  return 'thumbnails';
};

export const serializeBrowseListLayout = (layout: BrowseListLayout): string | null =>
  layout === 'thumbnails' ? null : layout;

/** Count refine chips for the open Events/Places view (search and the bucket itself are separate). */
export const countBrowseListFilters = (
  filters: BrowseListFilterState,
  regions: readonly string[],
  bucket: BrowseListBucket = 'events',
  geoPathDepth = 0,
  lockedGeoDepth = 0
): number => {
  let count = regions.length;
  const geoDrill = Math.max(0, geoPathDepth - lockedGeoDepth);
  if (geoDrill > 0) count += geoDrill;
  if (bucket === 'places') {
    count += filters.placeTopics.length;
    if (filters.hasTrip) count += 1;
    if (filters.facilityKinds.length > 0) count += 1;
    if (filters.audience !== 'anyone') count += 1;
    return count;
  }
  count += filters.tripTopics.length;
  if (filters.tripAvailabilityOnly) count += 1;
  if (filters.price !== 'all') count += 1;
  if (filters.when !== 'any') count += 1;
  if (filters.activityDatePreset !== 'anyday') count += 1;
  if (filters.audience !== 'anyone') count += 1;
  return count;
};