import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_GUEST_JOIN_LABEL,
  activityJoinCtaLabel,
  activityJoinIsFull,
} from '@uaetrail/shared-types';

describe('activityJoinIsFull', () => {
  it('is false when capacity or slots are unknown (guest / unlimited)', () => {
    expect(activityJoinIsFull({})).toBe(false);
    expect(activityJoinIsFull({ slotsAvailable: 0 })).toBe(false);
    expect(activityJoinIsFull({ slotsTotal: 10 })).toBe(false);
  });

  it('is true when capped and no spots left', () => {
    expect(activityJoinIsFull({ slotsTotal: 10, slotsAvailable: 0 })).toBe(true);
  });
});

describe('activityJoinCtaLabel guest vs full', () => {
  it('uses Sign in to join for guests when not full (RSVP or approval, any price)', () => {
    expect(
      activityJoinCtaLabel({
        participationMode: 'rsvp',
        requiresSignIn: true,
        isFull: false,
      })
    ).toBe(ACTIVITY_GUEST_JOIN_LABEL);
    expect(
      activityJoinCtaLabel({
        participationMode: 'approval',
        requiresSignIn: true,
        isFull: false,
      })
    ).toBe(ACTIVITY_GUEST_JOIN_LABEL);
    expect(
      activityJoinCtaLabel({
        participationMode: 'rsvp',
        requiresSignIn: true,
        price: 120,
        pricingMode: 'paid',
        requirements: ['Shared cost: Fuel'],
      })
    ).toBe(ACTIVITY_GUEST_JOIN_LABEL);
  });

  it('still shows Activity full when capped out', () => {
    expect(
      activityJoinCtaLabel({
        participationMode: 'rsvp',
        requiresSignIn: true,
        isFull: true,
      })
    ).toBe('Activity full');
  });
});
