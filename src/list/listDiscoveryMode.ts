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
  venueRegions: string[]
): ListDiscoveryViewState => {
  if (filters.query.trim()) {
    return { view: 'search', category: null };
  }
  if (filters.categories.length === 1) {
    return { view: 'category', category: filters.categories[0]! };
  }
  if (filters.categories.length > 1) {
    return { view: 'search', category: null };
  }
  if (
    filters.tripTopic !== 'all' ||
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
  venueRegions: string[]
): boolean => resolveListDiscoveryView(filters, venueRegions).view !== 'home';
