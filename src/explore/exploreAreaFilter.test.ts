import { describe, expect, it } from 'vitest';
import { seekingExploreMapItem } from './exploreMapItemFixtures';
import { filterExploreMapItemsByAreaSlug, exploreMapItemMatchesAreaSlug } from './exploreAreaFilter';

describe('exploreAreaFilter', () => {
  it('filters map rows by areaSlug', () => {
    const inHatta = { ...seekingExploreMapItem(), areaSlug: 'hatta', areaId: 'a1' };
    const other = { ...seekingExploreMapItem({ intentId: '2' }), areaSlug: 'jebel-jais', areaId: 'a2' };
    const filtered = filterExploreMapItemsByAreaSlug([inHatta, other], 'hatta');
    expect(filtered).toHaveLength(1);
    expect(exploreMapItemMatchesAreaSlug(inHatta, 'hatta')).toBe(true);
  });
});
