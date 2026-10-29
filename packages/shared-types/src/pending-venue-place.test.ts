import { describe, expect, it } from 'vitest';
import {
  PENDING_VENUE_PLACE_PREFIX,
  activityHasPendingVenuePlace,
  pendingVenuePlaceId,
} from './pending-venue-place.js';

describe('pending venue place marker', () => {
  it('reads the submitted place id from requirements', () => {
    const requirements = [`${PENDING_VENUE_PLACE_PREFIX}loc-new`];
    expect(pendingVenuePlaceId(requirements)).toBe('loc-new');
    expect(activityHasPendingVenuePlace(requirements)).toBe(true);
  });

  it('ignores unrelated requirement lines', () => {
    expect(pendingVenuePlaceId(['No pets'])).toBeNull();
    expect(activityHasPendingVenuePlace(['No pets'])).toBe(false);
  });
});
