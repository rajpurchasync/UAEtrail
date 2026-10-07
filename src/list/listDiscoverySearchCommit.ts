import type { ExploreSearchScopeKey } from '../explore/exploreBrowseTaxonomy';
import type { BrowseMainCategoryKey } from './browseListTaxonomy';

/** Map explore search scope picks to list category URL state (spots → venues). */
export const browseCategoriesForSearchScope = (
  scope: ExploreSearchScopeKey
): BrowseMainCategoryKey[] | null => {
  switch (scope) {
    case 'trips':
      return ['trips'];
    case 'spots':
      return ['venues'];
    case 'shops':
      return ['shops'];
    case 'facilities':
      return null;
    default:
      return null;
  }
};
