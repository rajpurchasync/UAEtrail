import { describe, expect, it } from 'vitest';
import { resolveDestinationIdForActivityPublish } from '../src/lib/destination-resolution.js';
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

describe('resolveDestinationIdForActivityPublish', () => {
  it('prefers place.destinationId over activity.destinationId', async () => {
    const activity = { ...baseActivity(), destinationId: 'legacy-activity-dest' };
    const location = { destinationId: 'place-dest' } as Location;
    await expect(resolveDestinationIdForActivityPublish(activity, location)).resolves.toBe(
      'place-dest'
    );
  });

  it('uses place.destinationId when activity has none', async () => {
    const activity = baseActivity();
    const location = { destinationId: 'place-dest' } as Location;
    await expect(resolveDestinationIdForActivityPublish(activity, location)).resolves.toBe(
      'place-dest'
    );
  });

  it('uses persisted activity.destinationId when the place has none', async () => {
    const activity = { ...baseActivity(), destinationId: 'dest-persisted-hatta' };
    const location = { id: 'hatta-dam-loop', destinationId: null } as Location;
    await expect(resolveDestinationIdForActivityPublish(activity, location)).resolves.toBe(
      'dest-persisted-hatta'
    );
  });

  it('does not invent a destination when neither row has destinationId', async () => {
    const activity = baseActivity();
    const location = {
      id: 'hatta-dam-loop',
      destinationId: null,
      latitude: 24.78,
      longitude: 56.12,
    } as Location;
    await expect(resolveDestinationIdForActivityPublish(activity, location)).resolves.toBeNull();
  });
});
