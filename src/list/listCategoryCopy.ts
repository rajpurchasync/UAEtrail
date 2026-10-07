import type { BrowseMainCategoryKey } from './browseListTaxonomy';

export const LIST_CATEGORY_PAGE_TITLE: Record<BrowseMainCategoryKey, string> = {
  trips: 'Activities',
  venues: 'Places',
  shops: 'Shops',
  guides: 'Buddies',
  agencies: 'Agencies',
};

export const listCategoryResultsLabel = (count: number, category: BrowseMainCategoryKey): string => {
  if (category === 'trips') {
    const n = count.toLocaleString();
    return count === 1 ? 'Found 1 activity' : `Found ${n} activities`;
  }
  if (category === 'shops') {
    return count === 1 ? '1 shop' : `${count.toLocaleString()} shops`;
  }
  if (category === 'guides') {
    return count === 1 ? 'Found 1 buddy' : `Found ${count.toLocaleString()} buddies`;
  }
  if (category === 'agencies') {
    return count === 1 ? '1 agency' : `${count.toLocaleString()} agencies`;
  }
  if (category === 'venues') {
    const n = count.toLocaleString();
    return count === 1 ? 'Found 1 place' : `Found ${n} places`;
  }
  const noun = count === 1 ? 'place' : 'places';
  return `${count.toLocaleString()} ${noun}`;
};
