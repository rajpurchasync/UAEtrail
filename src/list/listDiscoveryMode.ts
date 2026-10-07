import type { BrowseListFilterState } from './browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

export type ListDiscoveryView = 'home' | 'category' | 'search';

export type ListDiscoveryViewState = {
  view: ListDiscoveryView;
  category: BrowseMainCategoryKey | null;
};

/** Home vs single-category dedicated page vs mixed search/results. */
export const resolveListDiscoveryView = (
  filters: BrowseListFilterState,
  venueRegions: string[],
  listCat: BrowseMainCategoryKey | null
): ListDiscoveryViewState => {
  if (listCat) {
    return { view: 'category', category: listCat };
  }
  if (filters.query.trim()) {
    return { view: 'search', category: null };
  }
  if (filters.categories.length > 1) {
    return { view: 'search', category: null };
  }
  if (
    filters.tripTopics.length > 0 ||
    filters.placeTopics.length > 0 ||
    filters.tripLookingOnly ||
    filters.price !== 'all' ||
    filters.when !== 'any' ||
    filters.activityDatePreset !== 'anyday' ||
    venueRegions.length > 0
  ) {
    return { view: 'search', category: null };
  }
  return { view: 'home', category: null };
};

/** True when any filter/search is active (Refine badge, leave home). */
export const listDiscoveryHasActiveFilters = (
  filters: BrowseListFilterState,
  venueRegions: string[],
  listCat: BrowseMainCategoryKey | null
): boolean => resolveListDiscoveryView(filters, venueRegions, listCat).view !== 'home';

/** Title/back chrome — dedicated category page or single-category search (e.g. Places + topic pills). */
export const resolveListCategoryHeaderFocus = (
  filters: BrowseListFilterState,
  venueRegions: string[],
  listCat: BrowseMainCategoryKey | null
): BrowseMainCategoryKey | null => {
  const resolved = resolveListDiscoveryView(filters, venueRegions, listCat);
  if (resolved.view === 'category' && resolved.category) return resolved.category;
  if (resolved.view === 'search' && filters.categories.length === 1) {
    return filters.categories[0];
  }
  return null;
};
