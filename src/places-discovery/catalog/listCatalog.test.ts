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

  it('does not treat amenity POIs as list place rows', () => {
    const toilet = venueExploreMapItem({
      id: 'facility:toilet-1',
      source: 'facility',
      kind: 'event',
      placeKind: 'toilet',
      title: 'Toilets',
    });
    const trail = venueExploreMapItem({ id: 'venue:v1', title: 'Trail' });
    const merged = mergeListCatalogPlansAndPlaces([toilet, trail]);
    expect(merged.map((item) => item.id)).toEqual(['venue:v1']);
  });
});
