import { describe, expect, it } from 'vitest';
import type { ActivityDetailDTO } from '@uaetrail/shared-types';
import { shouldListActivityGuidesOnDetail } from './activityPublisherDisplay';

const activity = (overrides: Partial<ActivityDetailDTO>): ActivityDetailDTO =>
  ({
    id: 'act-1',
    tenantId: 't1',
    tenantSlug: 't',
    locationId: 'p1',
    locationName: 'Hatta',
    activityType: 'hiking',
    title: 'Loop',
    description: '',
    date: '2026-10-01',
    time: '06:00',
    price: 0,
    slotsTotal: 8,
    slotsAvailable: 8,
    status: 'published',
    ...overrides,
  }) as ActivityDetailDTO;

describe('shouldListActivityGuidesOnDetail', () => {
  it('hides a community outing’s sole host from a second guides list', () => {
    expect(
      shouldListActivityGuidesOnDetail(
        activity({
          publishingProfileKind: 'community',
          hostName: 'Fatima',
          guides: [{ userId: 'u1', displayName: 'Fatima', avatarUrl: null }],
        })
      )
    ).toBe(false);
  });

  it('lists every accepted guide on company outings and on community outings with extras', () => {
    expect(
      shouldListActivityGuidesOnDetail(
        activity({
          publishingProfileKind: 'agency',
          tenantName: 'UAE Adventure Co',
          guides: [{ userId: 'u1', displayName: 'Fatima', avatarUrl: null }],
        })
      )
    ).toBe(true);
    expect(
      shouldListActivityGuidesOnDetail(
        activity({
          publishingProfileKind: 'community',
          guides: [
            { userId: 'u1', displayName: 'Fatima', avatarUrl: null },
            { userId: 'u2', displayName: 'Omar', avatarUrl: null },
          ],
        })
      )
    ).toBe(true);
  });
});
