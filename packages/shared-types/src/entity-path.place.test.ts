import { describe, expect, it } from 'vitest';
import {
  canonicalPlaceDetailPath,
  legacyPlaceDetailPath,
  parseEntityRefFromPathname,
  placeDetailPath,
} from './entity-path.js';

describe('place detail paths (CPC-6)', () => {
  it('links new UI to /place/:id', () => {
    expect(placeDetailPath('hiking', 'abc')).toBe('/place/abc');
    expect(placeDetailPath('camping', 'abc')).toBe('/place/abc');
    expect(placeDetailPath('event', 'abc')).toBe('/place/abc');
    expect(placeDetailPath('shop', 'shop-1')).toBe('/shop/shop-1');
  });

  it('preserves legacy segments for redirects', () => {
    expect(legacyPlaceDetailPath('hiking', 'x')).toBe('/trail/x');
    expect(legacyPlaceDetailPath('camping', 'x')).toBe('/camp/x');
    expect(legacyPlaceDetailPath('event', 'x')).toBe('/venue/x');
  });

  it('parses canonical place pathname', () => {
    expect(parseEntityRefFromPathname('/place/trail-99')).toEqual({
      kind: 'place',
      id: 'trail-99',
      activityType: 'hiking',
    });
    expect(canonicalPlaceDetailPath('trail-99')).toBe('/place/trail-99');
  });
});
