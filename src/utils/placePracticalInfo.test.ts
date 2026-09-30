import { describe, expect, it } from 'vitest';
import { splitPlacePracticalTags } from './placePracticalInfo';

describe('splitPlacePracticalTags', () => {
  it('splits facility and nearby prefixed tags', () => {
    const result = splitPlacePracticalTags([
      'wadi',
      'facility:Toilet at trailhead',
      'nearby:Fuel ~10 km (ADNOC Kalba Rd)',
      'family',
    ]);
    expect(result.facilities).toEqual(['Toilet at trailhead']);
    expect(result.nearby).toEqual(['Fuel ~10 km (ADNOC Kalba Rd)']);
    expect(result.browseTags).toEqual(['wadi', 'family']);
  });
});
