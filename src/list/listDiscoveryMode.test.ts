import { describe, expect, it } from 'vitest';
import type { BrowseListFilterState } from './browseListFilters';
import { resolveListDiscoveryView } from './listDiscoveryMode';

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
});
