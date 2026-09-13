import { describe, expect, it } from 'vitest';
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
    expect(placeDetailPath('event', 'abc')).toBe('/event/abc');
  });

  it('keeps legacy location and venue aliases in sync', () => {
    expect(locationDetailPath('hiking', 'x')).toBe(placeDetailPath('hiking', 'x'));
    expect(venueLocationPath('camping', 'x')).toBe(placeDetailPath('camping', 'x'));
    expect(placeSharePath('event', 'x')).toBe('/event/x');
  });
});
