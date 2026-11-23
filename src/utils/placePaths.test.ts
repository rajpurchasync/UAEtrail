import { describe, expect, it } from 'vitest';
import { parseEntityRefFromPathname } from '@uaetrail/shared-types';
import { placeDetailPath, placeReviewPath, placeSharePath } from './placePaths';

describe('placePaths', () => {
  it('builds canonical public URLs for places', () => {
    expect(placeDetailPath('hiking', 'abc')).toBe('/place/abc');
    expect(placeDetailPath('camping', 'abc')).toBe('/place/abc');
    expect(placeDetailPath('event', 'abc')).toBe('/venue/abc');
    expect(placeDetailPath('shop', 'abc')).toBe('/shop/abc');
  });

  it('builds review and share paths', () => {
    expect(placeReviewPath('hiking', 'x')).toBe(`${placeDetailPath('hiking', 'x')}#reviews`);
    expect(placeSharePath('event', 'x')).toBe('/venue/x');
  });

  it('parses canonical, venue, and legacy event place paths', () => {
    expect(parseEntityRefFromPathname('/place/p0')).toEqual({
      kind: 'place',
      id: 'p0',
      activityType: 'hiking',
    });
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
