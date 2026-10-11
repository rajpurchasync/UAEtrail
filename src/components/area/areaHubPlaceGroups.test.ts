import { describe, expect, it } from 'vitest';
import type { LocationDTO } from '@uaetrail/shared-types';
import { groupAreaHubPlaces } from './areaHubPlaceGroups';

const row = (partial: Partial<LocationDTO> & Pick<LocationDTO, 'id' | 'name' | 'activityType'>): LocationDTO =>
  ({
    region: 'Dubai',
    status: 'active',
    tags: [],
    ...partial,
  }) as LocationDTO;

describe('groupAreaHubPlaces', () => {
  it('groups trails, facilities, and shops separately', () => {
    const places = [
      row({ id: '1', name: 'Trail A', activityType: 'hiking' }),
      row({ id: '2', name: 'Camp B', activityType: 'camping' }),
      row({ id: '3', name: 'Gear', activityType: 'shop' }),
      row({
        id: '4',
        name: 'Toilet',
        activityType: 'event',
        tags: ['place-kind:toilet'],
      }),
    ];
    const groups = groupAreaHubPlaces(places);
    expect(groups.map((g) => g.key)).toEqual(['trails', 'camps', 'shops', 'facilities']);
    expect(groups[0].places).toHaveLength(1);
    expect(groups[3].places[0].name).toBe('Toilet');
  });
});
