import { describe, expect, it } from 'vitest';
import { resolveAreaIdForActivityPublish } from '../src/lib/area-resolution.js';
import type { MongoActivityDoc } from '../src/lib/entity-builders.js';
import type { Location } from '../src/domain/types.js';

const baseActivity = (): MongoActivityDoc =>
  ({
    _id: 'a1',
    tenantId: 't1',
    locationId: 'loc1',
    createdById: 'u1',
    hostId: 'u1',
    title: 'Test',
    description: 'desc',
    startAt: new Date(),
    endAt: null,
    meetingLat: 25,
    meetingLng: 55,
    status: 'draft',
    requirements: [],
    images: [],
    capacity: 10,
    priceAed: 0,
  }) as MongoActivityDoc;

describe('resolveAreaIdForActivityPublish', () => {
  it('prefers place.areaId over legacy activity.areaId', async () => {
    const activity = { ...baseActivity(), areaId: 'legacy-activity-area' };
    const location = { areaId: 'place-area' } as Location;
    await expect(resolveAreaIdForActivityPublish(activity, location)).resolves.toBe('place-area');
  });

  it('uses place.areaId when activity has none', async () => {
    const activity = baseActivity();
    const location = { areaId: 'place-area' } as Location;
    await expect(resolveAreaIdForActivityPublish(activity, location)).resolves.toBe('place-area');
  });

  it('does not infer from coordinates', async () => {
    const activity = baseActivity();
    const location = { areaId: null, latitude: 24.83, longitude: 56.09 } as Location;
    await expect(resolveAreaIdForActivityPublish(activity, location)).resolves.toBeNull();
  });
});
