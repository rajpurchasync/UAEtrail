import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  createDraftFromPastActivity,
  resolveOrganizeComposeKindFromActivity,
} from './organizeFromActivity';

const baseActivity = (overrides: Partial<ActivityDTO> = {}): ActivityDTO =>
  ({
    id: 'act-1',
    tenantId: 'tenant-1',
    tenantSlug: 'guide',
    locationId: 'place-1',
    locationName: 'Wadi Trail',
    activityType: 'hiking',
    title: 'Sunrise hike',
    description: 'Bring water and good shoes for the full morning loop.',
    date: '2026-10-01',
    time: '06:00',
    price: 0,
    slotsTotal: 8,
    slotsAvailable: 8,
    status: 'published',
    meetingLat: 25.1,
    meetingLng: 55.2,
    startLat: 25.1,
    startLng: 55.2,
    participationMode: 'approval',
    joinMode: 'open',
    ...overrides,
  }) as ActivityDTO;

describe('organizeFromActivity', () => {
  it('maps hiking activity to organize hiking kind and registry prefill', () => {
    expect(resolveOrganizeComposeKindFromActivity(baseActivity())).toBe('hiking');
    const draft = createDraftFromPastActivity(baseActivity());
    expect(draft.kind).toBe('hiking');
    expect(draft.registryPlaceId).toBe('place-1');
    expect(draft.title).toBe('Sunrise hike');
    expect(draft.meetingLatitude).toBe(25.1);
  });

  it('maps activities outing category to organize activity kind', () => {
    const activity = baseActivity({
      activityType: 'event',
      outingCategory: 'activities',
      outingTopic: 'climbing',
    });
    expect(resolveOrganizeComposeKindFromActivity(activity)).toBe('activity');
    const draft = createDraftFromPastActivity(activity);
    expect(draft.kind).toBe('activity');
    expect(draft.activityTopic).toBe('climb');
  });
});
