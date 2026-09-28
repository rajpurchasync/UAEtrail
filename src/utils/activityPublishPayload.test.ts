import { describe, expect, it } from 'vitest';
import {
  APPROVAL_PARTICIPATION_REQUIREMENT,
  RSVP_PARTICIPATION_REQUIREMENT,
} from '@uaetrail/shared-types';
import {
  buildHostActivityPublishPayload,
  buildParticipationRequirementLines,
  defaultParticipationModeForActivityType,
  mergeParticipationRequirements,
  OPEN_JOIN_REQUIREMENT,
  PRIVATE_JOIN_REQUIREMENT,
  stripParticipationRequirementLines,
} from './activityPublishPayload';

describe('buildParticipationRequirementLines', () => {
  it('writes RSVP lines for open map visibility', () => {
    expect(
      buildParticipationRequirementLines({ participationMode: 'rsvp', joinMode: 'open' })
    ).toEqual([RSVP_PARTICIPATION_REQUIREMENT]);
  });

  it('writes approval + open join hint for public approval activities', () => {
    expect(
      buildParticipationRequirementLines({ participationMode: 'approval', joinMode: 'open' })
    ).toEqual([APPROVAL_PARTICIPATION_REQUIREMENT, OPEN_JOIN_REQUIREMENT]);
  });

  it('writes private join line instead of open hint', () => {
    expect(
      buildParticipationRequirementLines({ participationMode: 'approval', joinMode: 'private' })
    ).toEqual([APPROVAL_PARTICIPATION_REQUIREMENT, PRIVATE_JOIN_REQUIREMENT]);
  });

  it('writes private RSVP line without approval suffix', () => {
    expect(
      buildParticipationRequirementLines({ participationMode: 'rsvp', joinMode: 'private' })
    ).toEqual([
      RSVP_PARTICIPATION_REQUIREMENT,
      'Private: group or invite only — invite link only',
    ]);
  });
});

describe('mergeParticipationRequirements', () => {
  it('prepends canonical lines and strips duplicates from detail requirements', () => {
    const merged = mergeParticipationRequirements(
      [RSVP_PARTICIPATION_REQUIREMENT, 'What to bring: water'],
      { participationMode: 'approval', joinMode: 'open' }
    );

    expect(merged[0]).toBe(APPROVAL_PARTICIPATION_REQUIREMENT);
    expect(merged[1]).toBe(OPEN_JOIN_REQUIREMENT);
    expect(merged).toContain('What to bring: water');
    expect(merged.filter((line) => line === RSVP_PARTICIPATION_REQUIREMENT)).toHaveLength(0);
  });
});

describe('stripParticipationRequirementLines', () => {
  it('removes participation and join sentinel strings', () => {
    expect(
      stripParticipationRequirementLines([
        APPROVAL_PARTICIPATION_REQUIREMENT,
        OPEN_JOIN_REQUIREMENT,
        PRIVATE_JOIN_REQUIREMENT,
        'Fitness level: moderate',
      ])
    ).toEqual(['Fitness level: moderate']);
  });
});

describe('defaultParticipationModeForActivityType', () => {
  it('defaults events to RSVP and other types to approval', () => {
    expect(defaultParticipationModeForActivityType('event')).toBe('rsvp');
    expect(defaultParticipationModeForActivityType('hiking')).toBe('approval');
    expect(defaultParticipationModeForActivityType('camping')).toBe('approval');
  });
});

describe('buildHostActivityPublishPayload', () => {
  it('builds a hiking payload with participation fields', () => {
    const payload = buildHostActivityPublishPayload({
      activityType: 'hiking',
      locationId: 'loc-1',
      title: 'Sunrise hike',
      description: 'Easy loop',
      date: '2026-09-24',
      time: '06:00',
      capacity: 8,
      pricing: { pricingMode: 'free', price: 0, paymentTerms: null },
      location: {
        meetingPoint: 'Trailhead',
        meetingLat: 25.1,
        meetingLng: 55.2,
        startPoint: 'Trailhead',
        startLat: 25.1,
        startLng: 55.2,
      },
      requirements: [APPROVAL_PARTICIPATION_REQUIREMENT, OPEN_JOIN_REQUIREMENT],
      joinMode: 'open',
      participationMode: 'approval',
      images: ['hero.jpg'],
      hostId: 'user-1',
    });

    expect(payload).toMatchObject({
      activityType: 'hiking',
      locationId: 'loc-1',
      title: 'Sunrise hike',
      joinMode: 'open',
      participationMode: 'approval',
      hostId: 'user-1',
      pricingMode: 'free',
      price: 0,
    });
    expect(payload).not.toHaveProperty('paymentTerms');
    expect(payload).not.toHaveProperty('carPoolEnabled');
  });

  it('omits paymentTerms when empty so API zod validation passes', () => {
    const payload = buildHostActivityPublishPayload({
      activityType: 'camping',
      locationId: 'loc-c',
      title: 'Weekend camp out',
      description: 'Overnight camp with gear check.',
      date: '2026-09-24',
      time: '18:00',
      capacity: 6,
      pricing: { pricingMode: 'free', price: 0, paymentTerms: null },
      location: { meetingPoint: 'Meet', meetingLat: 25, meetingLng: 55, startLat: 25, startLng: 55 },
      requirements: [],
      joinMode: 'open',
      participationMode: 'approval',
    });
    expect(payload.paymentTerms).toBeUndefined();
  });

  it('adds carpool fields for carpool activity type', () => {
    const payload = buildHostActivityPublishPayload({
      activityType: 'carpool',
      locationId: 'loc-2',
      title: 'Ride to Hatta',
      description: 'Shared ride',
      date: '2026-09-25',
      time: '08:00',
      capacity: 3,
      pricing: { pricingMode: 'shared', price: 25, paymentTerms: null },
      location: {
        meetingPoint: 'Dubai Marina',
        meetingLat: 25.08,
        meetingLng: 55.14,
        startPoint: 'Hatta',
        startLat: 24.82,
        startLng: 56.13,
      },
      requirements: [APPROVAL_PARTICIPATION_REQUIREMENT],
      joinMode: 'open',
      participationMode: 'approval',
      carpool: {
        carPoolFree: false,
        carPoolPriceAed: 25,
        carPoolSeats: 3,
        carPoolDetails: 'Confirm pickup after joining.',
      },
    });

    expect(payload).toMatchObject({
      carPoolEnabled: true,
      carPoolFree: false,
      carPoolPriceAed: 25,
      carPoolSeats: 3,
      carPoolDetails: 'Confirm pickup after joining.',
    });
  });

  it('includes paid price packages from host console input', () => {
    const payload = buildHostActivityPublishPayload({
      activityType: 'event',
      locationId: 'loc-3',
      title: 'Trail run',
      description: '5k',
      date: '2026-09-26',
      time: '07:00',
      capacity: 50,
      pricing: {
        pricingMode: 'paid',
        price: 50,
        pricePackages: [{ label: 'Standard', amount: 50, currency: 'AED' }],
        paymentTerms: null,
      },
      location: {},
      requirements: [RSVP_PARTICIPATION_REQUIREMENT],
      joinMode: 'open',
      participationMode: 'rsvp',
    });

    expect(payload.pricePackages).toEqual([{ label: 'Standard', amount: 50, currency: 'AED' }]);
    expect(payload.participationMode).toBe('rsvp');
  });
});
