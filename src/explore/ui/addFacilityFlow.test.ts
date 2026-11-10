import { describe, expect, it } from 'vitest';
import { applyFacilityAddParentPlace, FACILITY_ADD_STEPS } from './addFacilityFlow';

describe('addFacilityFlow', () => {
  it('includes parentPlace step between area and pin', () => {
    expect(FACILITY_ADD_STEPS).toEqual([
      'title',
      'facilityType',
      'curatedArea',
      'parentPlace',
      'location',
      'image',
      'description',
      'review',
    ]);
  });

  it('applyFacilityAddParentPlace sets parentPlaceId and area from catalog row', () => {
    expect(
      applyFacilityAddParentPlace({
        id: 'trail-1',
        name: 'Wadi loop',
        areaId: 'area-hatta',
        latitude: 25.1,
        longitude: 56.2,
      })
    ).toEqual({
      parentPlaceId: 'trail-1',
      parentPlaceName: 'Wadi loop',
      areaId: 'area-hatta',
      latitude: 25.1,
      longitude: 56.2,
    });
  });
});
