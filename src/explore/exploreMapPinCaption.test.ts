import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  formatMapPinRelativeDate,
  MAP_PIN_SEEKING_CAPTION,
  resolveExploreMapPinPlaceHub,
  resolveMapPinActivityCaption,
  resolveMapPinVenueTripLabel,
} from './exploreMapPinCaption';

describe('exploreMapPinCaption', () => {
  const now = new Date('2026-11-18T10:00:00');

  it('formats relative dates', () => {
    expect(formatMapPinRelativeDate('2026-11-18', now)).toBe('Today');
    expect(formatMapPinRelativeDate('2026-11-19', now)).toBe('Tomorrow');
    expect(formatMapPinRelativeDate('2026-11-21', now)).toBe('Sat');
    expect(formatMapPinRelativeDate('2026-11-10', now)).toBeNull();
    expect(formatMapPinRelativeDate('2026-12-01', now)).toBe('1Dec');
  });

  it('resolves place hub from area or venue hint', () => {
    expect(
      resolveExploreMapPinPlaceHub({
        id: 'a',
        title: 'Outing',
        kind: 'hiking',
        source: 'activity',
        latitude: 1,
        longitude: 1,
        path: '/a',
        areaLabel: 'Hatta',
        geoRef: {
          names: { country: 'UAE', state: 'Dubai', area: 'Hatta', venue: 'Hatta' },
        } as ExploreMapItemDTO['geoRef'],
      } as ExploreMapItemDTO)
    ).toBe('Hatta');

    expect(
      resolveExploreMapPinPlaceHub({
        id: 'a',
        title: 'Wadi Ghalilah Trail #3',
        kind: 'hiking',
        source: 'activity',
        latitude: 1,
        longitude: 1,
        path: '/a',
        areaLabel: 'Shawka',
        presentation: { venueHint: 'Hiking trail location', listTitle: 'Wadi Ghalilah Trail #3' },
        locationCard: { id: 'loc-1', name: 'Wadi Ghalilah Trail #3' },
      } as ExploreMapItemDTO)
    ).toBe('Shawka');
  });

  it('resolves activity captions with what, when, and where', () => {
    expect(
      resolveMapPinActivityCaption({
        kind: 'hiking',
        scheduleDate: '2026-11-20',
        activityMode: 'hosted',
        source: 'activity',
        mapZoom: 8,
        now,
      })
    ).toBeNull();

    expect(
      resolveMapPinActivityCaption({
        kind: 'hiking',
        placeHub: 'Hatta',
        scheduleDate: '2026-11-19',
        activityMode: 'hosted',
        source: 'activity',
        mapZoom: 9,
        now,
      })
    ).toEqual({ primary: 'Hiking · Tomorrow', where: 'Hatta' });

    expect(
      resolveMapPinActivityCaption({
        kind: 'rideshare',
        placeHub: 'Shawka',
        activityMode: 'seeking',
        source: 'activity',
        mapZoom: 11,
        now,
      })
    ).toEqual({ primary: MAP_PIN_SEEKING_CAPTION, where: 'Shawka' });
  });

  it('formats venue trip labels', () => {
    expect(resolveMapPinVenueTripLabel(1, 9)).toBeNull();
    expect(resolveMapPinVenueTripLabel(1, 11)).toBe('Trip');
    expect(resolveMapPinVenueTripLabel(3, 12)).toBe('3 trips');
  });
});