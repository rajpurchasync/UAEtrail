import { describe, expect, it } from 'vitest';
import { Accessibility } from '../src/domain/enums.js';
import { buildLocationCreateData } from '../src/services/location-submit.js';

describe('buildLocationCreateData', () => {
  it('persists areaLabel and syncs area tag for outdoor venues', () => {
    const data = buildLocationCreateData(
      {
        name: 'Wadi Shawka Loop',
        countryCode: 'AE',
        region: 'RAK',
        areaLabel: 'Wadi Shawka Dam',
        activityType: 'hiking',
        description: 'A scenic loop with dam views and moderate elevation gain for weekend hikers.',
        difficulty: 'moderate',
        images: ['/media/test.jpg'],
        accessibleBy: ['car'],
        childFriendly: true,
      },
      'user-1'
    );

    expect(data.areaLabel).toBe('Wadi Shawka Dam');
    expect(data.childFriendly).toBe(true);
    expect(data.tags).toContain('area:Wadi Shawka Dam');
    expect(data.accessibility).toBe(Accessibility.CAR_ACCESSIBLE);
    expect(data.submittedBy).toEqual({ connect: { id: 'user-1' } });
  });

  it('derives remote accessibility from 4x4-only access', () => {
    const data = buildLocationCreateData(
      {
        name: 'Desert Camp',
        countryCode: 'AE',
        region: 'Abu Dhabi',
        activityType: 'camping',
        description: 'Remote dunes camp — high clearance required, no sedan access past the last graded road.',
        images: ['/media/camp.jpg'],
        accessibleBy: ['4x4'],
        surfaceType: ['sand'],
      },
      'user-2'
    );

    expect(data.accessibility).toBe(Accessibility.REMOTE);
  });
});
