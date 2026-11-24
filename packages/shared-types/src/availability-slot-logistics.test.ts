import { describe, expect, it } from 'vitest';
import {
  formatAvailabilitySlotLogisticsLine,
  sanitizeAvailabilitySlotLogistics,
} from './availability-slot-logistics.js';

describe('availability-slot-logistics', () => {
  it('sanitizes transport + party fields', () => {
    expect(
      sanitizeAvailabilitySlotLogistics({
        partySize: 3.7,
        transportMode: 'has_vehicle',
        vehicleType: 'suv',
        carpoolSeatsNeeded: 9,
      })
    ).toMatchObject({
      partySize: 4,
      transportMode: 'has_vehicle',
      vehicleType: 'suv',
      carpoolSeatsNeeded: null,
    });
  });

  it('formats logistics line for cards', () => {
    const line = formatAvailabilitySlotLogisticsLine({
      partySize: 2,
      transportMode: 'needs_carpool',
      carpoolSeatsNeeded: 2,
      vehicleType: null,
    });
    expect(line).toBe('Party of 2 · Needs carpool · 2 seats');
  });
});