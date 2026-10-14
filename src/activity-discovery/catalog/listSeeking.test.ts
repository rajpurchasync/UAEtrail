import { describe, expect, it } from 'vitest';
import { hostedExploreMapItem, seekingExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { selectSeekingActivitiesForListCatalog } from './listSeeking';

describe('selectSeekingActivitiesForListCatalog', () => {
  it('returns only seeking activities from the catalog slice', () => {
    const hosted = hostedExploreMapItem({ id: 'activity:h1' });
    const seeking = seekingExploreMapItem({ id: 'activity:s1' });
    const result = selectSeekingActivitiesForListCatalog([hosted, seeking]);
    expect(result.map((i) => i.id)).toEqual(['activity:s1']);
  });
});
