import type { BrowseListFilterState } from '../browseListFilters';
import type { ListExplorerBucket } from './listExplorerBucket';

export const LIST_LAYOUT_PARAM = 'layout';

export type ListExplorerLayout = 'thumbnails' | 'list' | 'calendar';

const LAYOUTS = new Set<ListExplorerLayout>(['thumbnails', 'list', 'calendar']);

export const parseListExplorerLayout = (value: string | null): ListExplorerLayout => {
  if (value && LAYOUTS.has(value as ListExplorerLayout)) return value as ListExplorerLayout;
  return 'thumbnails';
};

export const serializeListExplorerLayout = (layout: ListExplorerLayout): string | null =>
  layout === 'thumbnails' ? null : layout;

/** Count refine chips for the open Events/Places view (search and the bucket itself are separate). */
export const countListExplorerFilters = (
  filters: BrowseListFilterState,
  regions: readonly string[],
  bucket: ListExplorerBucket = 'events'
): number => {
  let count = regions.length;
  if (bucket === 'places') {
    count += filters.placeTopics.length;
    return count;
  }
  count += filters.tripTopics.length;
  if (filters.tripLookingOnly) count += 1;
  if (filters.price !== 'all') count += 1;
  if (filters.when !== 'any') count += 1;
  if (filters.activityDatePreset !== 'anyday') count += 1;
  return count;
};
