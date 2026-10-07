import type { BrowseMainCategoryKey } from './browseListTaxonomy';

export const LIST_CATEGORY_PAGE_TITLE: Record<BrowseMainCategoryKey, string> = {
  trips: 'Trips & Plans',
  venues: 'Trails & Spots',
  shops: 'Shops & Gear',
};

export const listCategoryResultsLabel = (count: number, category: BrowseMainCategoryKey): string => {
  if (category === 'trips') {
    const n = count.toLocaleString();
    return count === 1 ? 'Found 1 plan and trip' : `Found ${n} plans and trips`;
  }
  if (category === 'shops') {
    return count === 1 ? '1 shop' : `${count.toLocaleString()} shops`;
  }
  const noun = count === 1 ? 'place' : 'places';
  return `${count.toLocaleString()} ${noun}`;
};
