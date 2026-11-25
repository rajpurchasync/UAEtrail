import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { matchesExplorePinKindFilter } from './ui/exploreMapPinModel';
import { parseExplorePinKindFilter } from './explorePinKindFilter';

const destinationItem = (): ExploreMapItemDTO => ({
  id: 'destination:hatta',
  kind: 'destination',
  source: 'destination',
  title: 'Hatta',
  latitude: 24.8,
  longitude: 56.1,
  path: '/destination/hatta',
  destinationSlug: 'hatta',
});

describe('Destination is not a map pin', () => {
  it('legacy pinKind=locations maps to Spots, not destination hub rows', () => {
    expect(parseExplorePinKindFilter('locations')).toBe('places');
    const destination = destinationItem();
    const place: ExploreMapItemDTO = {
      id: 'venue:1',
      kind: 'hiking',
      source: 'place',
      title: 'Trail',
      latitude: 1,
      longitude: 2,
      path: '/place/1',
    };
    expect(matchesExplorePinKindFilter(destination, 'places')).toBe(false);
    expect(matchesExplorePinKindFilter(place, 'places')).toBe(true);
    expect(matchesExplorePinKindFilter(destination, 'locations')).toBe(false);
    expect(matchesExplorePinKindFilter(place, 'locations')).toBe(true);
  });
});