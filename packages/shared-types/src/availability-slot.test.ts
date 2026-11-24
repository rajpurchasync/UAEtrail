import { describe, expect, it } from 'vitest';
import {
  deriveModalitiesFromSlots,
  hydrateMemberAvailabilitySlots,
  normalizeAvailabilitySlot,
  validateMemberAvailabilityWrite,
} from './availability-slot.js';

describe('availability-slot (MIG-SG-B1)', () => {
  it('forbids guide as a modality', () => {
    const err = validateMemberAvailabilityWrite({
      slots: [
        {
          startDate: '2030-06-01',
          endDate: '2030-06-01',
          capacity: 'participant',
          modalities: ['guide' as 'hiking'],
        },
      ],
      visibility: 'public',
      guideProfileComplete: true,
      canHostPaidActivities: false,
    });
    expect(err?.code).toBe('guide_modality_forbidden');
  });

  it('requires guide profile for guide capacity', () => {
    const err = validateMemberAvailabilityWrite({
      slots: [
        {
          startDate: '2030-06-01',
          endDate: '2030-06-01',
          capacity: 'guide',
          modalities: ['hiking'],
        },
      ],
      visibility: 'public',
      guideProfileComplete: false,
      canHostPaidActivities: false,
    });
    expect(err?.code).toBe('guide_profile_required');
  });

  it('rejects participant slots with non-free terms', () => {
    const err = validateMemberAvailabilityWrite({
      slots: [
        {
          startDate: '2030-06-01',
          endDate: '2030-06-01',
          capacity: 'participant',
          modalities: ['hiking'],
          engagementTerms: { pricingKind: 'paid', rate: 100 },
        },
      ],
      visibility: 'public',
      guideProfileComplete: true,
      canHostPaidActivities: true,
    });
    expect(err?.code).toBe('participant_terms_free_only');
  });

  it('derives legacy kinds from slot modalities only', () => {
    const slots = hydrateMemberAvailabilitySlots(
      [
        { startDate: '2030-06-01', endDate: '2030-06-01', modalities: ['camping', 'hiking'] },
        { startDate: '2030-06-02', endDate: '2030-06-02', capacity: 'guide', modalities: ['hiking'] },
      ],
      ['event']
    );
    expect(deriveModalitiesFromSlots(slots).sort()).toEqual(['camping', 'hiking']);
    expect(
      normalizeAvailabilitySlot(
        { startDate: '2030-06-01', endDate: '2030-06-01' },
        ['guide', 'camping']
      ).capacity
    ).toBe('guide');
  });
});