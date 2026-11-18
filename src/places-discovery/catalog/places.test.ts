import { describe, expect, it } from 'vitest';
import { hostedExploreMapItem, venueExploreMapItem } from '../../explore/exploreMapItemFixtures';
import { selectPlacesFromMapItems, selectShopsFromMapItems } from './places';

describe('places discovery catalog', () => {
  it('selectPlacesFromMapItems keeps venue pins', () => {
    const venue = venueExploreMapItem({ id: 'venue:v1' });
    const activity = hostedExploreMapItem({ id: 'activity:a1' });
    const result = selectPlacesFromMapItems([venue, activity], {
      mapFilter: 'all',
      venueRegions: [],
    });
    expect(result.map((i) => i.id)).toEqual(['venue:v1']);
  });

  it('selectShopsFromMapItems keeps shop list items only', () => {
    const venue = venueExploreMapItem({ id: 'venue:v1' });
    const shop = venueExploreMapItem({ id: 'shop:s1', source: 'shop', kind: 'shop' });
    const result = selectShopsFromMapItems([venue, shop]);
    expect(result.some((i) => i.id === 'shop:s1')).toBe(true);
    expect(result.some((i) => i.id === 'venue:v1')).toBe(false);
  });
});