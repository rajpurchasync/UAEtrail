import { describe, expect, it } from 'vitest';
import {
  effectiveTripMapTopics,
  parseTripMapTopicsParam,
  serializeTripMapTopicsParam,
  toggleTripMapTopic,
} from './exploreMapQuickTopicFilters';

describe('exploreMapQuickTopicFilters', () => {
  it('parses and serializes trip types', () => {
    expect(parseTripMapTopicsParam('hiking,camping,invalid')).toEqual(['hiking', 'camping']);
    expect(serializeTripMapTopicsParam(['hiking', 'rideshare'])).toBe('hiking,rideshare');
    expect(serializeTripMapTopicsParam([])).toBeNull();
  });

  it('resolves effective topics from legacy single filter', () => {
    expect(effectiveTripMapTopics('all', [])).toEqual([]);
    expect(effectiveTripMapTopics('hiking', [])).toEqual(['hiking']);
    expect(effectiveTripMapTopics('all', ['camping', 'others'])).toEqual(['camping', 'others']);
  });

  it('toggles multi-select topics', () => {
    expect(toggleTripMapTopic(['hiking'], 'camping')).toEqual(['hiking', 'camping']);
    expect(toggleTripMapTopic(['hiking', 'camping'], 'hiking')).toEqual(['camping']);
  });
});
