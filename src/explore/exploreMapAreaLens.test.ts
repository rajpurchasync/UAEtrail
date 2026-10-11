import { describe, expect, it } from 'vitest';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { matchesExplorePinKindFilter } from './ui/exploreMapPinModel';

const areaItem = (): ExploreMapItemDTO => ({
  id: 'area:hatta',
  kind: 'area',
  source: 'area',
  title: 'Hatta',
  latitude: 24.8,
  longitude: 56.1,
  path: '/area/hatta',
  areaSlug: 'hatta',
});

describe('Locations lens pin filter', () => {
  it('shows only area rows when pinKind=locations', () => {
    const area = areaItem();
    const venue: ExploreMapItemDTO = {
      id: 'venue:1',
      kind: 'hiking',
      source: 'venue',
      title: 'Trail',
      latitude: 1,
      longitude: 2,
      path: '/trail/1',
    };
    expect(matchesExplorePinKindFilter(area, 'locations')).toBe(true);
    expect(matchesExplorePinKindFilter(venue, 'locations')).toBe(false);
  });
});
