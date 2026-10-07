import { describe, expect, it } from 'vitest';
import { parseBrowseListFilterState, serializeBrowseListSearchParams } from './browseListUrlState';

describe('browseListUrlState trip topics', () => {
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
      },
      []
    );
    expect(serialized.get('filter')).toBe('hiking,others');
  });
});
