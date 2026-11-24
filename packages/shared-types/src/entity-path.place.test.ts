import { describe, expect, it } from 'vitest';
import {
  canonicalPlaceDetailPath,
  canonicalizeInboundProductPath,
  inboundKindPlaceDetailPath,
  parseEntityRefFromPathname,
  placeDetailPath,
  placeDetailPathForId,
  rewriteStaleEntityInboundPath,
} from './entity-path.js';

describe('place detail paths (CPC-6)', () => {
  it('links new UI to /place/:id', () => {
    expect(placeDetailPath('hiking', 'abc')).toBe('/place/abc');
    expect(placeDetailPath('camping', 'abc')).toBe('/place/abc');
    expect(placeDetailPath('event', 'abc')).toBe('/venue/abc');
    expect(placeDetailPath('shop', 'shop-1')).toBe('/shop/shop-1');
  });

  it('does not guess /venue from an unknown place type', () => {
    expect(placeDetailPathForId('fossil-rock-desert-camp')).toBe('/place/fossil-rock-desert-camp');
    expect(placeDetailPathForId('fossil-rock-desert-camp', 'camping')).toBe(
      '/place/fossil-rock-desert-camp'
    );
    expect(placeDetailPathForId('event-hall', 'event')).toBe('/venue/event-hall');
  });

  it('inbound segments are parse/migration only (not product emit)', () => {
    expect(inboundKindPlaceDetailPath('hiking', 'x')).toBe('/trail/x');
    expect(inboundKindPlaceDetailPath('camping', 'x')).toBe('/camp/x');
    expect(inboundKindPlaceDetailPath('event', 'x')).toBe('/venue/x');
  });

  it('rewrites stale entity bookmarks to canonical URLs', () => {
    expect(rewriteStaleEntityInboundPath('/trail/foo?tab=overview')).toBe('/place/foo?tab=overview');
    expect(rewriteStaleEntityInboundPath('/camp/bar')).toBe('/place/bar');
    expect(rewriteStaleEntityInboundPath('/event/hall-1')).toBe('/venue/hall-1');
  });

  it('canonicalizeInboundProductPath chains entity then hub rules', () => {
    expect(canonicalizeInboundProductPath('/trail/foo')).toBe('/place/foo');
    expect(canonicalizeInboundProductPath('/map')).toBe('/explore');
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
