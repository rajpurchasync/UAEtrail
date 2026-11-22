import { describe, expect, it } from 'vitest';
import type { ActivityDTO } from '@uaetrail/shared-types';
import {
  createDraftFromPastActivity,
  resolveHostComposeKindFromActivity,
} from './hostingFromActivity';

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

describe('hostingFromActivity', () => {
  it('maps hiking activity to organize hiking kind and registry prefill', () => {
    expect(resolveHostComposeKindFromActivity(baseActivity())).toBe('hiking');
    const draft = createDraftFromPastActivity(baseActivity());
    expect(draft.kind).toBe('hiking');
    expect(draft.registryPlaceId).toBe('place-1');
    expect(draft.title).toBe('Sunrise hike');
    expect(draft.meetingLatitude).toBe(25.1);
    expect(draft.guideUserIds).toEqual([]);
  });

  it('copies packing list and join notes from requirements', () => {
    const draft = createDraftFromPastActivity(
      baseActivity({
        requirements: [
          'Instructions: Water 2 L.',
          'Packing ack: strict',
          'Packing item: must|shoes|🥾|Hiking Shoes',
          'Packing item: nice|poles|🎿|Trekking poles',
        ],
      })
    );
    expect(draft.joinKit).toBe('Water 2 L.');
    expect(draft.packingAckMode).toBe('strict');
    expect(draft.packingItems).toEqual([
      { id: 'shoes', label: 'Hiking Shoes', emoji: '🥾', required: true },
      { id: 'poles', label: 'Trekking poles', emoji: '🎿', required: false },
    ]);
  });

  it('copies extra accepted guides and skips the creator', () => {
    const draft = createDraftFromPastActivity(
      baseActivity({
        hostUserId: 'host-1',
        createdById: 'host-1',
        guides: [
          { userId: 'host-1', displayName: 'Samira', avatarUrl: null },
          { userId: 'guide-2', displayName: 'Omar', avatarUrl: null },
        ],
      })
    );
    expect(draft.guideUserIds).toEqual(['guide-2']);
  });

  it('prefills discoverCommunityId from activity unless private', () => {
    const withClub = createDraftFromPastActivity(
      baseActivity({ discoverCommunityId: 'club-abc', joinMode: 'open' })
    );
    expect(withClub.discoverCommunityId).toBe('club-abc');

    const privateOuting = createDraftFromPastActivity(
      baseActivity({ discoverCommunityId: 'club-abc', joinMode: 'private' })
    );
    expect(privateOuting.discoverCommunityId).toBeNull();
  });

  it('maps activities outing category to organize activity kind', () => {
    const activity = baseActivity({
      activityType: 'event',
      outingCategory: 'activities',
      outingTopic: 'climbing',
    });
    expect(resolveHostComposeKindFromActivity(activity)).toBe('activity');
    const draft = createDraftFromPastActivity(activity);
    expect(draft.kind).toBe('activity');
    expect(draft.activityTopic).toBe('climb');
  });
});
