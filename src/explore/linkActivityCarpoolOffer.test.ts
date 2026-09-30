import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { canLinkCarpoolToActivity } from './linkActivityCarpoolOffer';

const baseActivity = (overrides: Partial<ActivityDTO> = {}): ActivityDTO =>
  ({
    id: 'a1',
    tenantId: 't1',
    locationId: 'loc',
    activityType: 'hiking',
    title: 'Sunrise hike',
    description: '',
    date: '2026-09-12',
    time: '06:00',
    price: 0,
    slotsTotal: 8,
    slotsAvailable: 8,
    status: 'published',
    ...overrides,
  }) as ActivityDTO;

describe('canLinkCarpoolToActivity', () => {
  it('allows optional carpool link on published hiking, camping, and events (incl. FLOW-05)', () => {
    expect(canLinkCarpoolToActivity(baseActivity({ activityType: 'hiking' }))).toBe(true);
    expect(canLinkCarpoolToActivity(baseActivity({ activityType: 'camping' }))).toBe(true);
    expect(canLinkCarpoolToActivity(baseActivity({ activityType: 'event' }))).toBe(true);
  });

  it('blocks carpool link on rideshare activities only', () => {
    expect(canLinkCarpoolToActivity(baseActivity({ activityType: 'carpool' }))).toBe(false);
    expect(
      canLinkCarpoolToActivity(baseActivity({ linkedCarpoolActivityId: 'ride-1' }))
    ).toBe(true);
    expect(canLinkCarpoolToActivity(null)).toBe(false);
  });
});
