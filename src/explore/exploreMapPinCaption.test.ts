import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  formatMapPinRelativeDate,
  MAP_PIN_LOOKING_CAPTION,
  resolveExploreMapPinPlaceHub,
  resolveMapPinActivityCaption,
  resolveMapPinPlaceCaption,
  resolveMapPinVenueTripLabel,
  truncateMapPinVenueTwoWords,
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
        placeHubLabel: 'Hatta',
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
        placeHubLabel: 'Shawka',
        presentation: { venueHint: 'Hiking trail location', listTitle: 'Wadi Ghalilah Trail #3' },
        locationCard: { id: 'loc-1', name: 'Wadi Ghalilah Trail #3' },
      } as ExploreMapItemDTO)
    ).toBe('Shawka');
  });

  it('resolves trip captions with activity type and date only', () => {
    expect(
      resolveMapPinActivityCaption({
        kind: 'hiking',
        scheduleDate: '2026-11-20',
        activityMode: 'hosted',
        source: 'activity',
        mapZoom: 8,
        mapStyle: 'map',
        now,
      })
    ).toBeNull();

    expect(
      resolveMapPinActivityCaption({
        kind: 'hiking',
        scheduleDate: '2026-11-19',
        activityMode: 'hosted',
        source: 'activity',
        mapZoom: 9,
        mapStyle: 'map',
        selected: true,
        now,
      })
    ).toEqual({ primary: 'Hiking', where: 'Tomorrow' });

    expect(
      resolveMapPinActivityCaption({
        kind: 'hiking',
        source: 'availability',
        scheduleDate: '2026-11-20',
        mapZoom: 9,
        mapStyle: 'map',
        now,
      })
    ).toEqual({ primary: MAP_PIN_LOOKING_CAPTION, where: 'Fri' });
  });

  it('resolves place captions as type + venue name (two words max)', () => {
    expect(truncateMapPinVenueTwoWords('Wadi Ghalilah Trail Section')).toBe('Wadi Ghalilah');
    expect(
      resolveMapPinPlaceCaption({
        kind: 'hiking',
        source: 'place',
        venueName: 'Wadi Ghalilah Trail #3',
        mapZoom: 9,
        mapStyle: 'map',
      })
    ).toEqual({ primary: 'Trail', where: 'Wadi Ghalilah' });
    expect(
      resolveMapPinPlaceCaption({
        kind: 'camping',
        source: 'place',
        venueName: 'Al Qudra Lakes Camp',
        mapZoom: 8,
        mapStyle: 'map',
      })
    ).toBeNull();
  });

  it('formats venue trip labels', () => {
    expect(resolveMapPinVenueTripLabel(1, 10)).toBeNull();
    expect(resolveMapPinVenueTripLabel(1, 11)).toBe('Trip');
    expect(resolveMapPinVenueTripLabel(3, 12)).toBe('3 trips');
  });
});