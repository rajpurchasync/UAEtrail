import type { ExploreSearchScopeKey } from '../discoveryListRuntime';
import type { BrowseListFilterState } from '../browseListFilters';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Map explore search scope picks to list category URL state. */
export const browseCategoriesForSearchScope = (
  scope: ExploreSearchScopeKey
): BrowseMainCategoryKey[] | null => {
  switch (scope) {
    case 'activities':
      return ['activities'];
    case 'places':
      return ['venues'];
    case 'people':
      return ['people'];
    case 'shops':
      return ['venues'];
    case 'agencies':
      return ['agencies'];
    case 'facilities':
      return null;
    default:
      return null;
  }
};

/** URL/filter patch when user commits search with a scope chip. */
export const browseListFilterPatchForSearchScope = (
  scope: ExploreSearchScopeKey
): Partial<BrowseListFilterState> | null => {
  const categories = browseCategoriesForSearchScope(scope);
  if (!categories) return null;
  if (scope === 'people') {
    return { categories, tripAvailabilityOnly: false, tripTopics: [], placeTopics: [] };
  }
  if (scope === 'activities') {
    return { categories, tripAvailabilityOnly: false, placeTopics: [] };
  }
  if (scope === 'places') {
    return { categories, tripAvailabilityOnly: false, tripTopics: [], placeTopics: [] };
  }
  if (scope === 'shops') {
    return { categories, tripAvailabilityOnly: false, tripTopics: [], placeTopics: ['shop'] };
  }
  return { categories };
};
