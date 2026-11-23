import { describe, expect, it } from 'vitest';
import {
  formatGuideEngagementTermsBrowseLine,
  pickGuideEngagementTermsFromSlots,
} from './availability-engagement-terms.js';
import { validateMemberAvailabilityWrite } from './availability-slot.js';

describe('availability-engagement-terms (MIG-SG-C1)', () => {
  it('formats browse line from guide slot terms', () => {
    const line = formatGuideEngagementTermsBrowseLine({
      pricingKind: 'paid',
      rate: 350,
      tourShape: 'private',
      minParticipants: 2,
      maxParticipants: 6,
    });
    expect(line).toBe('From AED 350 · Private · Min 2 · Up to 6');
  });

  it('picks terms from guide capacity slots', () => {
    const terms = pickGuideEngagementTermsFromSlots([
      { startDate: '2030-01-01', endDate: '2030-01-01', capacity: 'participant' },
      {
        startDate: '2030-01-02',
        endDate: '2030-01-02',
        capacity: 'guide',
        engagementTerms: { pricingKind: 'free' },
      },
    ]);
    expect(terms?.pricingKind).toBe('free');
  });

  it('blocks paid terms without Pro', () => {
    const err = validateMemberAvailabilityWrite({
      slots: [
        {
          startDate: '2030-06-01',
          endDate: '2030-06-01',
          capacity: 'guide',
          modalities: ['hiking'],
          engagementTerms: { pricingKind: 'paid', rate: 200 },
        },
      ],
      visibility: 'public',
      guideProfileComplete: true,
      canHostPaidActivities: false,
    });
    expect(err?.code).toBe('paid_terms_not_allowed');
  });
});