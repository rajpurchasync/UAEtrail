import { describe, expect, it } from 'vitest';
import { ActivityStatus, ActivityType, LocationStatus, RequestStatus } from '../src/domain/enums.js';

/** Wire values consumers see — keep in sync with `apps/api/src/lib/mappers.ts` and shared-types. */
const ACTIVITY_TYPE_WIRE: Record<ActivityType, string> = {
  [ActivityType.HIKING]: 'hiking',
  [ActivityType.CAMPING]: 'camping',
  [ActivityType.EVENT]: 'event',
  [ActivityType.RIDESHARE]: 'rideshare',
  [ActivityType.SHOP]: 'shop',
  [ActivityType.COMMUNITY_ACTIVITY]: 'event',
};

const ACTIVITY_STATUS_WIRE: Record<ActivityStatus, string> = {
  [ActivityStatus.DRAFT]: 'draft',
  [ActivityStatus.PUBLISHED]: 'published',
  [ActivityStatus.CANCELLED]: 'cancelled',
  [ActivityStatus.SUSPENDED]: 'suspended',
};

const LOCATION_STATUS_WIRE: Record<LocationStatus, string> = {
  [LocationStatus.DRAFT]: 'draft',
  [LocationStatus.ACTIVE]: 'active',
  [LocationStatus.INACTIVE]: 'inactive',
};

const REQUEST_STATUS_WIRE: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: 'pending',
  [RequestStatus.APPROVED]: 'approved',
  [RequestStatus.REJECTED]: 'rejected',
  [RequestStatus.CANCELLED]: 'cancelled',
  [RequestStatus.WAITLISTED]: 'waitlisted',
};

describe('domain enum wire parity', () => {
  it('maps persistence ActivityType to FE wire slugs', () => {
    expect(Object.keys(ACTIVITY_TYPE_WIRE).sort()).toEqual(Object.values(ActivityType).sort());
    for (const value of Object.values(ActivityType)) {
      expect(ACTIVITY_TYPE_WIRE[value]).toMatch(/^[a-z_]+$/);
    }
  });

  it('maps persistence ActivityStatus to wire slugs', () => {
    expect(Object.keys(ACTIVITY_STATUS_WIRE).sort()).toEqual(Object.values(ActivityStatus).sort());
  });

  it('maps persistence LocationStatus to wire slugs', () => {
    expect(Object.keys(LOCATION_STATUS_WIRE).sort()).toEqual(Object.values(LocationStatus).sort());
  });

  it('maps persistence RequestStatus to wire slugs', () => {
    expect(Object.keys(REQUEST_STATUS_WIRE).sort()).toEqual(Object.values(RequestStatus).sort());
  });
});