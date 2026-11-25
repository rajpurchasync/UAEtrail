import type { BrowseMainCategoryKey } from '../list/browse/browseListTaxonomy';

/** Parse `listCat` query — accepts legacy aliases (`shops`, `trips`, `guides`). */
export const parseListCatParam = (value: string | null): BrowseMainCategoryKey | null => {
  if (value === 'shops') return 'venues';
  if (value === 'activities' || value === 'trips') return 'activities';
  if (value === 'guides') return 'people';
  if (value === 'venues' || value === 'people' || value === 'agencies') {
    return value;
  }
  return null;
};