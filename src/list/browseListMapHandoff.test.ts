import { describe, expect, it } from 'vitest';
import {
  inferListCatFromExploreHandoff,
  resolveListBrowseExplorePinKind,
  serializeBrowseListToExploreSearchParams,
} from './browseListMapHandoff';
import type { BrowseListFilterState } from './browseListFilters';

const baseState: BrowseListFilterState = {
  query: '',
  categories: [],
  tripTopics: [],
  placeTopics: [],
  tripLookingOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
};

describe('browseListMapHandoff', () => {
  it('sets explore pinKind=places for Places category list', () => {
    const params = serializeBrowseListToExploreSearchParams(
      { ...baseState, categories: ['venues'], placeTopics: ['hiking'] },
      ['Dubai'],
      { listCat: 'venues' }
    );
    expect(params.get('pinKind')).toBe('places');
    expect(params.get('listCat')).toBeNull();
    expect(params.get('filter')).toBe('hiking');
    expect(params.get('topics')).toBe('spots');
  });

  it('infers listCat=venues from explore places pinKind', () => {
    const state = { ...baseState, categories: ['venues'] };
    const listCat = inferListCatFromExploreHandoff(state, new URLSearchParams('pinKind=places'));
    expect(listCat).toBe('venues');
  });

  it('resolves trips pinKind for activities category', () => {
    expect(resolveListBrowseExplorePinKind({ ...baseState, categories: ['trips'] }, 'trips')).toBe('trips');
    expect(
      resolveListBrowseExplorePinKind({ ...baseState, categories: ['trips'], tripLookingOnly: true }, 'trips')
    ).toBe('looking');
  });
});
