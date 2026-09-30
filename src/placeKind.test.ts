import { describe, expect, it } from 'vitest';
import {
  isPlaceKind,
  locationActivityTypeForPlaceKind,
  placeKindFromContributeVenueKind,
  placeKindFromLocationRow,
  tagsForPlaceKind,
} from '@uaetrail/shared-types';

describe('PlaceKind', () => {
  it('maps location wire types to canonical kinds', () => {
    expect(placeKindFromLocationRow({ activityType: 'hiking' })).toBe('hiking');
    expect(placeKindFromLocationRow({ activityType: 'event', tags: ['outdoor-other'] })).toBe(
      'outdoor_other'
    );
    expect(placeKindFromLocationRow({ activityType: 'event' })).toBe('event');
  });

  it('round-trips outdoor kinds to legacy activityType', () => {
    expect(locationActivityTypeForPlaceKind('outdoor_other')).toBe('event');
    expect(tagsForPlaceKind('outdoor_other')).toContain('outdoor-other');
  });

  it('maps contribute FAB kinds to PlaceKind', () => {
    expect(placeKindFromContributeVenueKind('shop')).toBe('shop');
    expect(placeKindFromContributeVenueKind('event')).toBe('outdoor_other');
    expect(placeKindFromContributeVenueKind('hiking')).toBe('hiking');
  });

  it('treats amenities as first-class PlaceKind values', () => {
    expect(isPlaceKind('toilet')).toBe(true);
    expect(tagsForPlaceKind('gas_station')).toEqual(['place-kind:gas_station']);
    expect(
      placeKindFromLocationRow({
        activityType: 'event',
        tags: ['place-kind:toilet'],
      })
    ).toBe('toilet');
  });
});
