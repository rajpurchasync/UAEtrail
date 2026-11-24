import { describe, expect, it } from 'vitest';
import {
  parseBrowseListFilterState,
  parseBrowseListGeoPath,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

describe('browseListUrlState trip topics', () => {
  it('maps retired listCat=guides bookmarks onto people', () => {
    expect(parseListCatParam('guides')).toBe('people');
  });

  it('defaults crews list to My crew hub when surface omitted', () => {
    const params = new URLSearchParams('listCat=people');
    const state = parseBrowseListFilterState(params);
    expect(state.crewPeopleSurface).toBe('my');
    expect(state.crewBrowseLane).toBe('people');
    expect(state.crewPeopleFacet).toBe('available');
    const serialized = serializeBrowseListSearchParams(state, []);
    expect(serialized.get('buddies')).toBeNull();
    expect(serialized.get('peopleTab')).toBeNull();
    expect(serialized.get('peopleFacet')).toBeNull();
  });

  it('ignores retired buddies=looking (canonical peopleFacet only)', () => {
    const params = new URLSearchParams('listCat=people&buddies=looking');
    const state = parseBrowseListFilterState(params);
    expect(state.crewBrowseLane).toBe('people');
    expect(state.crewPeopleFacet).toBe('available');
    const serialized = serializeBrowseListSearchParams(state, []);
    expect(serialized.get('buddies')).toBeNull();
    expect(serialized.get('peopleFacet')).toBeNull();
  });

  it('round-trips peopleFacet=available', () => {
    const params = new URLSearchParams('listCat=people&peopleFacet=available');
    const state = parseBrowseListFilterState(params);
    expect(state.crewBrowseLane).toBe('people');
    expect(state.crewPeopleFacet).toBe('available');
    const serialized = serializeBrowseListSearchParams(state, []);
    expect(serialized.get('peopleTab')).toBeNull();
    expect(serialized.get('peopleFacet')).toBeNull();
    expect(serialized.get('buddies')).toBeNull();
  });

  it('round-trips geo drill path', () => {
    const params = new URLSearchParams('geo=dubai/hatta');
    expect(parseBrowseListGeoPath(params)).toEqual(['dubai', 'hatta']);
    const state = parseBrowseListFilterState(params);
    const serialized = serializeBrowseListSearchParams(state, [], ['dubai', 'hatta']);
    expect(serialized.get('geo')).toBe('dubai/hatta');
  });

  it('round-trips availability-only list filter (canonical filter=availability)', () => {
    expect(parseBrowseListFilterState(new URLSearchParams('filter=looking')).tripAvailabilityOnly).toBe(false);
    expect(parseBrowseListFilterState(new URLSearchParams('filter=availability')).tripAvailabilityOnly).toBe(true);
    const serialized = serializeBrowseListSearchParams(
      {
        query: '',
        categories: ['activities'],
        tripTopics: [],
        placeTopics: [],
        tripAvailabilityOnly: true,
        price: 'all',
        when: 'any',
        activityDatePreset: 'anyday',
        crewBrowseLane: 'people',
        crewPeopleFacet: 'available',
        crewProfessionalKind: 'all',
        crewPeopleSurface: 'find',
        hasTrip: false,
        facilityKinds: [],
        audience: 'anyone',
      },
      []
    );
    expect(serialized.get('filter')).toBe('availability');
  });

  it('round-trips multiple filter topics', () => {
    const params = new URLSearchParams('filter=hiking,rideshare');
    const state = parseBrowseListFilterState(params);
    expect(state.tripTopics).toEqual(['hiking', 'rideshare']);

    const serialized = serializeBrowseListSearchParams(
      { ...state, categories: ['activities'], query: 'test' },
      []
    );
    expect(serialized.get('filter')).toBe('hiking,rideshare');
  });

  it('parses place topics when listCat is venues', () => {
    const params = new URLSearchParams('listCat=venues&filter=hiking,camping');
    const state = parseBrowseListFilterState(params);
    expect(state.placeTopics).toEqual(['hiking', 'camping']);
    expect(state.tripTopics).toEqual([]);
  });

  it('parses trip topics only when listCat is trips (hiking is not a place topic)', () => {
    const params = new URLSearchParams('listCat=trips&filter=hiking');
    const state = parseBrowseListFilterState(params);
    expect(state.tripTopics).toEqual(['hiking']);
    expect(state.placeTopics).toEqual([]);
  });

  it('serializes place topics when trip topics are empty', () => {
    const serialized = serializeBrowseListSearchParams(
      {
        query: '',
        categories: ['venues'],
        tripTopics: [],
        placeTopics: ['hiking', 'others'],
        tripAvailabilityOnly: false,
        price: 'all',
        when: 'any',
        activityDatePreset: 'anyday',
        crewBrowseLane: 'people',
        crewPeopleFacet: 'available',
        crewProfessionalKind: 'all',
        crewPeopleSurface: 'find',
        hasTrip: false,
        facilityKinds: [],
        audience: 'anyone',
      },
      []
    );
    expect(serialized.get('filter')).toBe('hiking,others');
    expect(serialized.get('peopleFacet')).toBeNull();
  });
});