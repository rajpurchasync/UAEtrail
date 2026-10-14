import { describe, expect, it } from 'vitest';
import { hostedExploreMapItem, venueExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { mergeListCatalogPlansAndPlaces } from './listCatalog';

describe('mergeListCatalogPlansAndPlaces', () => {
  it('orders activities before venue catalog rows', () => {
    const venue = venueExploreMapItem({ id: 'venue:v1', title: 'Trail' });
    const activity = hostedExploreMapItem({ id: 'activity:a1', title: 'Hike' });
    const merged = mergeListCatalogPlansAndPlaces([venue, activity]);
    expect(merged[0].id).toBe('activity:a1');
    expect(merged[1].id).toBe('venue:v1');
  });
});
