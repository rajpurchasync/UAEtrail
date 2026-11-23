import { describe, expect, it } from 'vitest';
import {
  discoveryKindsFromSlots,
  memberHasGuideCapacityInSlots,
  personMatchesAvailabilityKindQuery,
  primaryMapPinKindFromSlot,
} from './availability-discovery-projection.js';

const range = { start: '2026-11-01', end: '2026-11-30' };

describe('availability-discovery-projection', () => {
  it('guide query matches capacity, not kinds array', () => {
    const slots = [
      {
        startDate: '2026-11-05',
        endDate: '2026-11-05',
        capacity: 'guide' as const,
        modalities: ['hiking'] as const,
      },
    ];
    expect(personMatchesAvailabilityKindQuery(slots, 'guide', range.start, range.end)).toBe(true);
    expect(memberHasGuideCapacityInSlots(slots, range.start, range.end)).toBe(true);
    expect(discoveryKindsFromSlots(slots, range.start, range.end)).toEqual(['hiking', 'guide']);
  });

  it('modality query ignores guide-only capacity for hiking filter', () => {
    const slots = [
      {
        startDate: '2026-11-05',
        endDate: '2026-11-05',
        capacity: 'guide' as const,
        modalities: ['hiking'] as const,
      },
    ];
    expect(personMatchesAvailabilityKindQuery(slots, 'hiking', range.start, range.end)).toBe(true);
    expect(personMatchesAvailabilityKindQuery(slots, 'camping', range.start, range.end)).toBe(false);
  });

  it('empty modalities default to hiking for participant slots', () => {
    const slots = [{ startDate: '2026-11-05', endDate: '2026-11-05', capacity: 'participant' as const }];
    expect(personMatchesAvailabilityKindQuery(slots, 'hiking', range.start, range.end)).toBe(true);
    expect(primaryMapPinKindFromSlot(slots[0]!)).toBe('hiking');
  });
});