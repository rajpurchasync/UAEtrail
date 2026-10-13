import { describe, expect, it } from 'vitest';
import { Accessibility } from '../src/domain/enums.js';
import { buildLocationCreateData } from '../src/services/location-submit.js';
import { buildTestLocationSubmitBody, testAreas } from './helpers/test-seed.js';

describe('buildLocationCreateData', () => {
  it('persists areaLabel and syncs area tag for outdoor venues', () => {
    const data = buildLocationCreateData(
      buildTestLocationSubmitBody({
        name: 'Wadi Shawka Loop',
        region: 'RAK',
        areaId: testAreas.hatta.id,
        areaLabel: 'Wadi Shawka Dam',
        difficulty: 'moderate',
        accessibleBy: ['car'],
        childFriendly: true,
      }),
      'user-1'
    );

    expect(data.areaId).toBe(testAreas.hatta.id);
    expect(data.areaLabel).toBe('Wadi Shawka Dam');
    expect(data.childFriendly).toBe(true);
    expect(data.tags).toContain('area:Wadi Shawka Dam');
    expect(data.accessibility).toBe(Accessibility.CAR_ACCESSIBLE);
    expect(data.submittedBy).toEqual({ connect: { id: 'user-1' } });
  });

  it('derives remote accessibility from 4x4-only access', () => {
    const data = buildLocationCreateData(
      buildTestLocationSubmitBody({
        name: 'Desert Camp',
        region: 'Abu Dhabi',
        activityType: 'camping',
        accessibleBy: ['4x4'],
        surfaceType: ['sand'],
      }),
      'user-2'
    );

    expect(data.accessibility).toBe(Accessibility.REMOTE);
  });
});
