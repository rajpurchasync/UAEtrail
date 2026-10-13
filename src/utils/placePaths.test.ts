import { describe, expect, it } from 'vitest';
import { parseEntityRefFromPathname } from '@uaetrail/shared-types';
import {
  locationDetailPath,
  placeDetailPath,
  placeSharePath,
  venueLocationPath,
} from './placePaths';

describe('placePaths', () => {
  it('builds typed public URLs for places', () => {
    expect(placeDetailPath('hiking', 'abc')).toBe('/trail/abc');
    expect(placeDetailPath('camping', 'abc')).toBe('/camp/abc');
    expect(placeDetailPath('event', 'abc')).toBe('/venue/abc');
    expect(placeDetailPath('shop', 'abc')).toBe('/shop/abc');
  });

  it('keeps legacy location and venue aliases in sync', () => {
    expect(locationDetailPath('hiking', 'x')).toBe(placeDetailPath('hiking', 'x'));
    expect(venueLocationPath('camping', 'x')).toBe(placeDetailPath('camping', 'x'));
    expect(placeSharePath('event', 'x')).toBe('/venue/x');
  });

  it('parses venue and legacy event place paths', () => {
    expect(parseEntityRefFromPathname('/venue/p1')).toEqual({
      kind: 'place',
      id: 'p1',
      activityType: 'event',
    });
    expect(parseEntityRefFromPathname('/event/p2')).toEqual({
      kind: 'place',
      id: 'p2',
      activityType: 'event',
    });
  });
});
