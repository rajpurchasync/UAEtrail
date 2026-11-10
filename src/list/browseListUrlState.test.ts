import { describe, expect, it } from 'vitest';
import {
  parseBrowseListFilterState,
  parseListCatParam,
  serializeBrowseListSearchParams,
} from './browseListUrlState';

describe('browseListUrlState trip topics', () => {
  it('maps retired listCat=guides bookmarks onto people', () => {
    expect(parseListCatParam('guides')).toBe('people');
  });

  it('parses buddies segment for people list', () => {
    const params = new URLSearchParams('listCat=people&buddies=looking');
    const state = parseBrowseListFilterState(params);
    expect(state.buddiesSegment).toBe('looking');
    const serialized = serializeBrowseListSearchParams(state, []);
    expect(serialized.get('buddies')).toBeNull();
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

  it('serializes a geo drill path', () => {
    const serialized = serializeBrowseListSearchParams(
      {
        query: '',
        categories: [],
        tripTopics: [],
        placeTopics: [],
        tripLookingOnly: false,
        price: 'all',
        when: 'any',
        activityDatePreset: 'anyday',
        buddiesSegment: 'looking',
      },
      ['Dubai'],
      ['geo-state-ae-dubai', 'geo-area-hatta']
    );
    expect(serialized.get('regions')).toBe('Dubai');
    expect(serialized.get('geo')).toBe('geo-state-ae-dubai/geo-area-hatta');
  });

  it('serializes place topics when trip topics are empty', () => {
    const serialized = serializeBrowseListSearchParams(
      {
        query: '',
        categories: ['venues'],
        tripTopics: [],
        placeTopics: ['hiking', 'others'],
        tripLookingOnly: false,
        price: 'all',
        when: 'any',
        activityDatePreset: 'anyday',
        buddiesSegment: 'available',
      },
      []
    );
    expect(serialized.get('filter')).toBe('hiking,others');
  });
});
