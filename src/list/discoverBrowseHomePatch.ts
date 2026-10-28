import type { BrowseListFilterState } from './browseListFilters';

/** Reset discover browse URL to the home rail (map overlay + /list). */
export const discoverBrowseHomeFilterPatch = (): Partial<BrowseListFilterState> & {
  listCat: null;
  regions: string[];
  buddiesSegment: 'available';
} => ({
  categories: [],
  listCat: null,
  tripTopics: [],
  placeTopics: [],
  tripLookingOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  buddiesSegment: 'available',
  regions: [],
});
