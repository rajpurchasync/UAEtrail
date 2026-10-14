import { describe, expect, it } from 'vitest';
import { parseBrowseListFilterState, serializeBrowseListSearchParams } from './browseListUrlState';

describe('browseListUrlState trip topics', () => {
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
      { ...state, categories: ['trips'], query: 'test' },
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
