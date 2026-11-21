import { MOBILE_FIVE_TAB_UI_LABELS } from '../../config/mobileFiveTabNav';
import type { ExploreSearchScopeCounts } from '../../explore/exploreBrowseTaxonomy';
import type { BrowseMainCategoryKey } from '../browseListTaxonomy';

export type ListExplorerBucket = 'events' | 'places';

export const LIST_EXPLORER_BUCKETS: ReadonlyArray<{
  key: ListExplorerBucket;
  label: string;
}> = [
  { key: 'events', label: 'Trips' },
  { key: 'places', label: MOBILE_FIVE_TAB_UI_LABELS.venues },
];

/** Default catalog is events. Places is `listCat=venues`. */
export const parseListExplorerBucket = (listCat: BrowseMainCategoryKey | null): ListExplorerBucket =>
  listCat === 'venues' ? 'places' : 'events';

export const serializeListExplorerBucket = (bucket: ListExplorerBucket): BrowseMainCategoryKey | null =>
  bucket === 'places' ? 'venues' : null;

export const listExplorerBucketCategories = (bucket: ListExplorerBucket): BrowseMainCategoryKey[] =>
  bucket === 'places' ? ['venues'] : ['activities'];

export const listExplorerSearchBucketCounts = (
  counts: ExploreSearchScopeCounts
): Record<ListExplorerBucket, number> => ({
  events: counts.activities,
  places: counts.places + counts.shops,
});

export const listExplorerBucketTotalLabel = (bucket: ListExplorerBucket, count: number): string => {
  if (bucket === 'events') return count === 1 ? '1 trip' : `${count.toLocaleString()} trips`;
  return count === 1 ? '1 place' : `${count.toLocaleString()} places`;
};