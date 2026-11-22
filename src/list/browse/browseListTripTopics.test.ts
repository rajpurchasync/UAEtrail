import { describe, expect, it } from 'vitest';
import { toggleBrowseTripTopicInList } from './browseListTripTopics';

describe('toggleBrowseTripTopicInList', () => {
  it('adds and removes topics independently', () => {
    expect(toggleBrowseTripTopicInList([], 'hiking')).toEqual(['hiking']);
    expect(toggleBrowseTripTopicInList(['hiking'], 'rideshare')).toEqual(['hiking', 'rideshare']);
    expect(toggleBrowseTripTopicInList(['hiking', 'rideshare'], 'hiking')).toEqual(['rideshare']);
  });
});
