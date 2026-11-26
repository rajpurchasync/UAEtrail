import { describe, expect, it } from 'vitest';
import { EXPLORE_PLACES_SEARCH_PATH } from './platform';
import { explorePlacesPath } from '../discovery/discoveryPortExploreRouting';

describe('EXPLORE_PLACES_SEARCH_PATH', () => {
  it('matches the venues explore path used by the website schema', () => {
    expect(explorePlacesPath()).toBe(EXPLORE_PLACES_SEARCH_PATH);
  });
});
