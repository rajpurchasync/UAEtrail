import { describe, expect, it } from 'vitest';
import type { BrowseListFilterState } from './browseListFilters';
import { resolveListCategoryHeaderFocus, resolveListDiscoveryView } from './listDiscoveryMode';

const homeFilters: BrowseListFilterState = {
  query: '',
  categories: ['trips'],
  tripTopics: [],
  placeTopics: [],
  tripLookingOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  buddiesSegment: 'going',
};

describe('resolveListDiscoveryView', () => {
  it('shows home when map topics imply trips only (no listCat)', () => {
    expect(resolveListDiscoveryView(homeFilters, [], null)).toEqual({
      view: 'home',
      category: null,
    });
  });

  it('shows category page when listCat is set', () => {
    expect(resolveListDiscoveryView(homeFilters, [], 'trips')).toEqual({
      view: 'category',
      category: 'trips',
    });
  });

  it('keeps category page when listCat is set even with a query', () => {
    const withQuery: BrowseListFilterState = { ...homeFilters, query: 'wadi', categories: ['venues'] };
    expect(resolveListDiscoveryView(withQuery, [], 'venues')).toEqual({
      view: 'category',
      category: 'venues',
    });
  });

  it('uses Places header focus on venue topic search without listCat', () => {
    const placesFilters: BrowseListFilterState = {
      ...homeFilters,
      categories: ['venues'],
      placeTopics: ['hiking'],
    };
    expect(resolveListDiscoveryView(placesFilters, [], null)).toEqual({
      view: 'search',
      category: null,
    });
    expect(resolveListCategoryHeaderFocus(placesFilters, [], null)).toBe('venues');
  });
});
