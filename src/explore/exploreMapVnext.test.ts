import { describe, expect, it } from 'vitest';
import { formatExploreMapBboxParam } from './exploreMapVnext';

describe('exploreMapVnext', () => {
  it('formatExploreMapBboxParam serializes west,south,east,north', () => {
    expect(formatExploreMapBboxParam({ west: 55, south: 25, east: 56, north: 26 })).toBe(
      '55,25,56,26'
    );
  });
});
