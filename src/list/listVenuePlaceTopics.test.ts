import { describe, expect, it } from 'vitest';
import {
  LIST_VENUE_PLACE_TOPIC_FILTERS,
  listVenuePlaceTopicsForUi,
  toggleListVenuePlaceTopic,
} from './listVenuePlaceTopics';

describe('listVenuePlaceTopics', () => {
  it('shows Hiking trail, Camping spots, Hubs', () => {
    expect(LIST_VENUE_PLACE_TOPIC_FILTERS.map((t) => t.key)).toEqual(['hiking', 'camping', 'others']);
    expect(listVenuePlaceTopicsForUi().map((t) => t.label)).toEqual([
      'Hiking trail',
      'Camping spots',
      'Hubs',
    ]);
  });

  it('toggles place topics independently', () => {
    expect(toggleListVenuePlaceTopic([], 'hiking')).toEqual(['hiking']);
    expect(toggleListVenuePlaceTopic(['hiking'], 'camping')).toEqual(['hiking', 'camping']);
    expect(toggleListVenuePlaceTopic(['hiking', 'camping'], 'hiking')).toEqual(['camping']);
  });
});
