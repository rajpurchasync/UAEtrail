import { MOBILE_FIVE_TAB_UI_LABELS } from '../../config/mobileFiveTabNav';
import type { ExploreSearchScopeCounts } from '../../discovery/discoveryPortExploreBrowseTaxonomy';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

export type BrowseListBucket = 'events' | 'places';

export const BROWSE_LIST_BUCKETS: ReadonlyArray<{
  key: BrowseListBucket;
  label: string;
}> = [
  { key: 'events', label: 'Trips' },
  { key: 'places', label: MOBILE_FIVE_TAB_UI_LABELS.venues },
];

/** Default catalog is events. Places is `listCat=venues`. */
export const parseBrowseListBucket = (listCat: BrowseMainCategoryKey | null): BrowseListBucket =>
  listCat === 'venues' ? 'places' : 'events';

export const serializeBrowseListBucket = (bucket: BrowseListBucket): BrowseMainCategoryKey | null =>
  bucket === 'places' ? 'venues' : null;

export const browseListBucketCategories = (bucket: BrowseListBucket): BrowseMainCategoryKey[] =>
  bucket === 'places' ? ['venues'] : ['activities'];

export const browseListSearchBucketCounts = (
  counts: ExploreSearchScopeCounts
): Record<BrowseListBucket, number> => ({
  events: counts.activities,
  places: counts.places + counts.shops,
});

export const browseListBucketTotalLabel = (bucket: BrowseListBucket, count: number): string => {
  if (bucket === 'events') return count === 1 ? '1 trip' : `${count.toLocaleString()} trips`;
  return count === 1 ? '1 place' : `${count.toLocaleString()} places`;
};