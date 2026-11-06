import { describe, expect, it } from 'vitest';
import {
  LIST_VENUE_PLACE_TOPIC_FILTERS,
  listVenuePlaceTopicsForUi,
  toggleListVenuePlaceTopic,
} from './listVenuePlaceTopics';

describe('listVenuePlaceTopics', () => {
  it('shows Trail, Camping, Facilities, Shopping, Other', () => {
    expect(LIST_VENUE_PLACE_TOPIC_FILTERS.map((t) => t.key)).toContain('facilities');
    expect(listVenuePlaceTopicsForUi().map((t) => t.label)).toEqual([
      'Trail',
      'Camping',
      'Facilities',
      'Shopping',
      'Other',
    ]);
  });

  it('toggles place topics independently', () => {
    expect(toggleListVenuePlaceTopic([], 'hiking')).toEqual(['hiking']);
    expect(toggleListVenuePlaceTopic(['hiking'], 'camping')).toEqual(['hiking', 'camping']);
    expect(toggleListVenuePlaceTopic(['hiking', 'camping'], 'hiking')).toEqual(['camping']);
  });
});
