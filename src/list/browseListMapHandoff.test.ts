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
  tripAvailabilityOnly: false,
  price: 'all',
  when: 'any',
  activityDatePreset: 'anyday',
  peopleBrowseTab: 'looking',
  hasTrip: false,
  facilityKinds: [],
  audience: 'anyone',
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
    expect(params.get('browse')).toBeNull();
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
    expect(resolveListBrowseExplorePinKind({ ...baseState, categories: ['activities'] }, 'activities')).toBe('activities');
    expect(
      resolveListBrowseExplorePinKind({ ...baseState, categories: ['activities'], tripAvailabilityOnly: true }, 'activities')
    ).toBe('activities');
  });

  it('omits pinKind for Crews list category', () => {
    expect(resolveListBrowseExplorePinKind({ ...baseState, categories: ['people'] }, 'people')).toBeNull();
    const params = serializeBrowseListToExploreSearchParams(
      { ...baseState, categories: ['people'], peopleBrowseTab: 'hub' },
      [],
      { listCat: 'people' }
    );
    expect(params.get('pinKind')).toBeNull();
    expect(params.get('listCat')).toBeNull();
    expect(params.get('browse')).toBeNull();
    expect(params.get('view')).toBe('people');
    expect(params.get('list')).toBe('1');
    expect(params.get('buddies')).toBeNull();
  });

  it('hands off crews peopleTab and clears date on map', () => {
    const params = serializeBrowseListToExploreSearchParams(
      { ...baseState, categories: ['people'], peopleBrowseTab: 'going', activityDatePreset: 'today' },
      [],
      { listCat: 'people' }
    );
    expect(params.get('peopleTab')).toBe('going');
    expect(params.get('buddies')).toBeNull();
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

  it('infers listCat from explore panel when pinKind omitted', () => {
    expect(inferListCatFromExploreHandoff(baseState, new URLSearchParams('panel=venues'))).toBe('venues');
    expect(inferListCatFromExploreHandoff(baseState, new URLSearchParams('panel=activities'))).toBe('activities');
  });
});
