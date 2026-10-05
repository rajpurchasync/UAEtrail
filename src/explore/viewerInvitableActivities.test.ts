import { describe, expect, it } from 'vitest';
import type { BuddyActivityPresenceRowDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import {
  buildViewerInvitableActivityRefs,
  invitableActivitiesForBuddy,
  listJoinInviteActivitiesForBuddy,
  pickJoinInviteActivityForBuddy,
} from './viewerInvitableActivities';

describe('viewerInvitableActivities', () => {
  const mapItem = (overrides: Partial<ExploreMapItemDTO> & { activityId: string }): ExploreMapItemDTO =>
    ({
      id: `activity:${overrides.activityId}`,
      source: 'activity',
      title: 'Hike',
      activity: { id: overrides.activityId, title: 'Hike', hostUserId: 'host-me' },
      participantPreviews: [],
      viewerAccess: { exposure: 'peek', gateReason: null },
      ...overrides,
    }) as ExploreMapItemDTO;

  it('lists activities the viewer hosts or joins', () => {
    const items = [
      mapItem({ activityId: 'a1', participantPreviews: [{ id: 'host-me', name: 'Me', avatar: null }] }),
      mapItem({ activityId: 'a2', activity: { id: 'a2', title: 'Other', hostUserId: 'other' } }),
    ];
    const refs = buildViewerInvitableActivityRefs(items, 'host-me', 'anyday');
    expect(refs.map((r) => r.activityId)).toEqual(['a1']);
  });

  it('skips outings the buddy is already on', () => {
    const invitable = [{ exploreItemId: 'activity:a1', activityId: 'a1', title: 'Hike' }];
    const row = {
      buddy: { userId: 'b1', displayName: 'Buddy', avatarUrl: null },
      hosting: null,
      joining: { exploreItemId: 'activity:a1', activityId: 'a1', title: 'Hike' },
    } as BuddyActivityPresenceRowDTO;
    expect(invitableActivitiesForBuddy(invitable, row)).toEqual([]);
  });

  it('prefers viewer-hosted outing for invite target', () => {
    const invitable = [
      { exploreItemId: 'activity:a1', activityId: 'a1', title: 'Guest trip' },
      { exploreItemId: 'activity:a2', activityId: 'a2', title: 'My trip' },
    ];
    const items = [
      mapItem({ activityId: 'a1', activity: { id: 'a1', title: 'Guest', hostUserId: 'other' } }),
      mapItem({ activityId: 'a2', activity: { id: 'a2', title: 'My trip', hostUserId: 'host-me' } }),
    ];
    const row = {
      buddy: { userId: 'b1', displayName: 'Buddy', avatarUrl: null },
      hosting: null,
      joining: null,
    } as BuddyActivityPresenceRowDTO;
    const picked = pickJoinInviteActivityForBuddy(invitable, row, items, 'host-me');
    expect(picked?.activityId).toBe('a2');
  });

  it('orders host outings before guest trips for invite list', () => {
    const invitable = [
      { exploreItemId: 'activity:a1', activityId: 'a1', title: 'Guest trip' },
      { exploreItemId: 'activity:a2', activityId: 'a2', title: 'My trip' },
    ];
    const items = [
      mapItem({ activityId: 'a1', activity: { id: 'a1', title: 'Guest', hostUserId: 'other' } }),
      mapItem({ activityId: 'a2', activity: { id: 'a2', title: 'My trip', hostUserId: 'host-me' } }),
    ];
    const row = {
      buddy: { userId: 'b1', displayName: 'Buddy', avatarUrl: null },
      hosting: null,
      joining: null,
    } as BuddyActivityPresenceRowDTO;
    const list = listJoinInviteActivitiesForBuddy(invitable, row, items, 'host-me');
    expect(list.map((r) => r.activityId)).toEqual(['a2', 'a1']);
  });
});
