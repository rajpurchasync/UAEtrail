import { describe, expect, it } from 'vitest';
import {
  resolveActivityPlaceLinkId,
  withActivityPlaceIdAlias,
} from './activity-place-wire.js';

describe('activity-place-wire', () => {
  it('resolveActivityPlaceLinkId accepts locationId or placeId', () => {
    expect(resolveActivityPlaceLinkId({ locationId: 'p1' })).toBe('p1');
    expect(resolveActivityPlaceLinkId({ placeId: 'p2' })).toBe('p2');
    expect(resolveActivityPlaceLinkId({ locationId: 'p1', placeId: 'p1' })).toBe('p1');
  });

  it('resolveActivityPlaceLinkId rejects conflicting ids', () => {
    expect(resolveActivityPlaceLinkId({ locationId: 'a', placeId: 'b' })).toBeNull();
  });

  it('withActivityPlaceIdAlias mirrors locationId', () => {
    expect(withActivityPlaceIdAlias({ locationId: 'x', title: 't' })).toEqual({
      locationId: 'x',
      placeId: 'x',
      title: 't',
    });
  });
});