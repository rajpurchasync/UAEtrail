import { describe, expect, it } from 'vitest';
import type { LocationDTO } from '@uaetrail/shared-types';
import { mapLocationToPlace } from './place';

const baseLocation = (overrides: Partial<LocationDTO> = {}): LocationDTO => ({
  id: 'loc-1',
  name: 'Test Peak',
  region: 'Dubai',
  activityType: 'hiking',
  description: 'A test trail',
  season: ['winter'],
  childFriendly: true,
  images: ['https://example.com/a.jpg'],
  featured: false,
  status: 'active',
  ...overrides,
});

describe('mapLocationToPlace', () => {
  it('maps hiking locations to Place with activityType hiking', () => {
    const place = mapLocationToPlace(baseLocation());
    expect(place.activityType).toBe('hiking');
    expect(place.name).toBe('Test Peak');
    expect(place.distance).toBeUndefined();
  });

  it('maps camping and event activity types', () => {
    expect(mapLocationToPlace(baseLocation({ activityType: 'camping' })).activityType).toBe('camping');
    expect(mapLocationToPlace(baseLocation({ activityType: 'event' })).activityType).toBe('event');
  });

  it('maps numeric trail stats when present', () => {
    const place = mapLocationToPlace(baseLocation({ distance: 5, duration: 3, elevation: 400 }));
    expect(place.distance).toBe(5);
    expect(place.duration).toBe(3);
    expect(place.elevation).toBe(400);
  });

  it('maps geoRef when present on LocationDTO', () => {
    const geoRef = {
      chain: ['c1', 's1', 'a1'],
      countryId: 'c1',
      stateId: 's1',
      areaId: 'a1',
      path: 'uae/rak/hatta',
      names: { country: 'UAE', state: 'RAK', area: 'Hatta' },
      searchTokens: ['hatta'],
    };
    const place = mapLocationToPlace(baseLocation({ geoRef }));
    expect(place.geoRef).toEqual(geoRef);
  });
});
