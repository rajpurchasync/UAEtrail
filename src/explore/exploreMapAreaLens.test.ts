import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { matchesExplorePinKindFilter } from './ui/exploreMapPinModel';
import { parseExplorePinKindFilter } from './explorePinKindFilter';

const areaItem = (): ExploreMapItemDTO => ({
  id: 'area:hatta',
  kind: 'area',
  source: 'area',
  title: 'Hatta',
  latitude: 24.8,
  longitude: 56.1,
  path: '/area/hatta',
  destinationSlug: 'hatta',
});

describe('Area is not a map pin', () => {
  it('legacy pinKind=locations maps to Spots, not area hub rows', () => {
    expect(parseExplorePinKindFilter('locations')).toBe('places');
    const area = areaItem();
    const place: ExploreMapItemDTO = {
      id: 'venue:1',
      kind: 'hiking',
      source: 'place',
      title: 'Trail',
      latitude: 1,
      longitude: 2,
      path: '/place/1',
    };
    expect(matchesExplorePinKindFilter(area, 'places')).toBe(false);
    expect(matchesExplorePinKindFilter(place, 'places')).toBe(true);
    expect(matchesExplorePinKindFilter(area, 'locations')).toBe(false);
    expect(matchesExplorePinKindFilter(place, 'locations')).toBe(true);
  });
});
