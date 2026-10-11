import { describe, expect, it } from 'vitest';
import { seekingExploreMapItem } from './exploreMapItemFixtures';
import type { AreaPublicDTO } from '@uaetrail/shared-types';
import {
  filterExploreMapItemsByAreaSlug,
  exploreMapItemMatchesAreaSlug,
  isStrongPublishedAreaSearchMatch,
  searchPublishedAreasForQuery,
} from './exploreAreaFilter';

const hattaArea = (): AreaPublicDTO => ({
  id: 'a1',
  slug: 'hatta',
  name: 'Hatta',
  region: 'Dubai',
  center: { latitude: 24.8, longitude: 56.1 },
  bounds: [
    { latitude: 24.7, longitude: 56.0 },
    { latitude: 24.9, longitude: 56.0 },
    { latitude: 24.9, longitude: 56.2 },
  ],
});

describe('exploreAreaFilter', () => {
  it('filters map rows by areaSlug', () => {
    const inHatta = { ...seekingExploreMapItem(), areaSlug: 'hatta', areaId: 'a1' };
    const other = { ...seekingExploreMapItem({ intentId: '2' }), areaSlug: 'jebel-jais', areaId: 'a2' };
    const filtered = filterExploreMapItemsByAreaSlug([inHatta, other], 'hatta');
    expect(filtered).toHaveLength(1);
    expect(exploreMapItemMatchesAreaSlug(inHatta, 'hatta')).toBe(true);
  });

  it('ranks area search matches for explore search (§3.3)', () => {
    const areas = [hattaArea(), { ...hattaArea(), id: 'a2', slug: 'hatta-dam', name: 'Hatta Dam', region: 'Dubai' }];
    const matches = searchPublishedAreasForQuery(areas, 'hatta');
    expect(matches[0]?.slug).toBe('hatta');
    expect(isStrongPublishedAreaSearchMatch(hattaArea(), 'Hatta')).toBe(true);
  });
});
