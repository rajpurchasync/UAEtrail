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
  buddiesSegment: 'looking',
};

describe('browseListMapHandoff', () => {
  it('sets explore pinKind=places for Places category list', () => {
    const params = serializeBrowseListToExploreSearchParams(
      { ...baseState, categories: ['venues'], placeTopics: ['hiking'] },
      ['Dubai'],
      { listCat: 'venues' }
    );
    expect(params.get('pinKind')).toBe('places');
    expect(params.get('listCat')).toBe('venues');
    expect(params.get('browse')).toBe('1');
    expect(params.get('filter')).toBe('hiking');
    expect(params.get('topics')).toBe('spots,shops');
  });

  it('infers listCat=venues from explore places pinKind', () => {
    const state: BrowseListFilterState = { ...baseState, categories: ['venues'] };
    const listCat = inferListCatFromExploreHandoff(state, new URLSearchParams('pinKind=places'));
    expect(listCat).toBe('venues');
  });

  it('infers listCat=venues from explore shops pinKind (shops live under Places)', () => {
    const listCat = inferListCatFromExploreHandoff(baseState, new URLSearchParams('pinKind=shops'));
    expect(listCat).toBe('venues');
  });

  it('resolves trips pinKind for activities category', () => {
    expect(resolveListBrowseExplorePinKind({ ...baseState, categories: ['trips'] }, 'trips')).toBe('activities');
    expect(
      resolveListBrowseExplorePinKind({ ...baseState, categories: ['trips'], tripLookingOnly: true }, 'trips')
    ).toBe('looking');
  });

  it('omits pinKind for Buddies list category', () => {
    expect(resolveListBrowseExplorePinKind({ ...baseState, categories: ['people'] }, 'people')).toBeNull();
    const params = serializeBrowseListToExploreSearchParams(
      { ...baseState, categories: ['people'] },
      [],
      { listCat: 'people' }
    );
    expect(params.get('pinKind')).toBeNull();
    expect(params.get('listCat')).toBe('people');
    expect(params.get('browse')).toBe('1');
    expect(params.get('view')).toBeNull();
    expect(params.get('peopleTab')).toBeNull();
    expect(params.get('buddies')).toBeNull();
  });

  it('hands off Buddies segment and clears date on map', () => {
    const params = serializeBrowseListToExploreSearchParams(
      { ...baseState, categories: ['people'], buddiesSegment: 'going', activityDatePreset: 'today' },
      [],
      { listCat: 'people' }
    );
    expect(params.get('buddies')).toBe('going');
    expect(params.get('date')).toBeNull();
  });

  it('infers listCat=people from explore searchScope=people', () => {
    const listCat = inferListCatFromExploreHandoff(baseState, new URLSearchParams('searchScope=people'));
    expect(listCat).toBe('people');
  });

  it('infers listCat=people from explore view=people', () => {
    const listCat = inferListCatFromExploreHandoff(baseState, new URLSearchParams('view=people&peopleTab=discover'));
    expect(listCat).toBe('people');
  });
});
