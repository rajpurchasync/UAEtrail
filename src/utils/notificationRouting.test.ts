import { describe, expect, it } from 'vitest';
import type { NotificationDTO } from '@uaetrail/shared-types';
import { inferNotificationPath } from './notificationRouting';

const notif = (meta: Record<string, unknown>): NotificationDTO => ({
  id: 'n1',
  title: 'Test',
  body: 'Body',
  type: 'request_update',
  isRead: false,
  createdAt: new Date().toISOString(),
  meta,
});

describe('inferNotificationPath', () => {
  it('routes join request lifecycle to My trips', () => {
    expect(
      inferNotificationPath(notif({ kind: 'join_request_pending', requestId: 'r1' }))
    ).toBe('/my-requests/r1');
    expect(inferNotificationPath(notif({ kind: 'join_request_waitlisted' }))).toBe(
      '/plan?view=plans&filter=joined'
    );
    expect(inferNotificationPath(notif({ kind: 'join_request_rejected' }))).toBe(
      '/plan?view=plans&filter=joined'
    );
  });

  it('routes approved join to activity welcome when activity id is known', () => {
    expect(inferNotificationPath(notif({ kind: 'join_request_approved' }))).toBe(
      '/plan?view=plans&filter=joined'
    );
    expect(
      inferNotificationPath(
        notif({ kind: 'join_request_approved', activityId: 'act-1', groupId: 'g-1' })
      )
    ).toBe('/activity/act-1?joined=1');
    expect(
      inferNotificationPath(
        notif({ kind: 'join_request_approved', path: '/activity/act-2?joined=1' })
      )
    ).toBe('/activity/act-2?joined=1');
  });

  it('routes member goal milestones to profile or trips', () => {
    expect(inferNotificationPath(notif({ kind: 'goal_halfway' }))).toBe('/plan?view=plans&tab=wishlist');
    expect(inferNotificationPath(notif({ kind: 'goal_complete' }))).toBe('/plan?view=plans&tab=wishlist');
    expect(inferNotificationPath(notif({ kind: 'goal_behind_pace' }))).toBe(
      '/plan?view=plans&tab=wishlist'
    );
  });

  it('routes buddy connection notifications to the acting member profile', () => {
    expect(
      inferNotificationPath(
        notif({ kind: 'connection_buddy_request', actorUserId: 'user-a' })
      )
    ).toBe('/member/user-a');
    expect(
      inferNotificationPath(
        notif({ kind: 'connection_buddy_accepted', actorUserId: 'user-b' })
      )
    ).toBe('/member/user-b');
    expect(
      inferNotificationPath(
        notif({ kind: 'connection_buddy_accepted', buddyUserId: 'legacy-b' })
      )
    ).toBe('/member/legacy-b');
  });

  it('routes activity join invites to activity detail join flow', () => {
    expect(
      inferNotificationPath(notif({ kind: 'activity_join_invite', activityId: 'act-42' }))
    ).toBe('/activity/act-42?invite=1');
  });

  it('routes community guide invites to the outing detail page', () => {
    expect(
      inferNotificationPath(notif({ kind: 'activity_guide_invite', activityId: 'act-9' }))
    ).toBe('/activity/act-9');
  });

  it('rewrites legacy explore invite paths to activity detail', () => {
    expect(
      inferNotificationPath(
        notif({
          kind: 'activity_join_invite',
          activityId: 'act-42',
          path: '/explore?pin=activity:act-42&invite=1&list=1',
        })
      )
    ).toBe('/activity/act-42?invite=1');
  });

  it('routes chat message notifications to messages composer', () => {
    expect(
      inferNotificationPath(notif({ kind: 'message', actorUserId: 'user-c' }))
    ).toBe('/chat?to=user-c');
    expect(
      inferNotificationPath(notif({ kind: 'message', senderId: 'legacy-sender' }))
    ).toBe('/chat?to=legacy-sender');
  });

  it('rewrites legacy rewards wallet paths to badges', () => {
    expect(inferNotificationPath(notif({ path: '/my-rewards' }))).toBe('/profile/badges');
    expect(inferNotificationPath(notif({ path: '/trail-points?ref=abc' }))).toBe('/profile/badges');
  });

  it('routes wishlist match alerts via meta.path', () => {
    expect(
      inferNotificationPath(
        notif({
          kind: 'wishlist_match',
          path: '/activity/act-9',
          wishlistItemId: 'wl-9',
        })
      )
    ).toBe('/activity/act-9');
    expect(
      inferNotificationPath(
        notif({
          kind: 'wishlist_match',
          path: '/explore?pin=activity:act-seek-1',
          wishlistItemId: 'wl-2',
        })
      )
    ).toBe('/explore?pin=activity:act-seek-1');
  });

  it('rewrites legacy trips hub paths in meta.path to Plan', () => {
    expect(
      inferNotificationPath(
        notif({
          kind: 'join_request_pending',
          path: '/trips?segment=upcoming&tab=joined',
        })
      )
    ).toBe('/plan?view=plans&filter=joined');
    expect(
      inferNotificationPath(
        notif({
          kind: 'goal_behind_pace',
          path: '/trips?segment=upcoming&tab=joined',
        })
      )
    ).toBe('/plan?view=plans&filter=joined');
  });

  it('does not rewrite leftover demand: pins in notification paths', () => {
    expect(
      inferNotificationPath(
        notif({
          kind: 'wishlist_match',
          path: '/explore?pin=demand:int-1&list=1',
          activityId: 'act-seek-1',
        })
      )
    ).toBe('/explore?pin=demand:int-1&list=1');
  });

  it('routes friend publish notifications to seeking explore pins when no top-level activityId', () => {
    expect(
      inferNotificationPath(
        notif({
          kind: 'friend_published',
          intentId: 'int-2',
          seekingActivityId: 'act-seek-2',
        })
      )
    ).toBe('/explore?list=1&panel=activities&pin=activity%3Aact-seek-2');
    expect(
      inferNotificationPath(
        notif({
          kind: 'friend_published',
          intentId: 'int-legacy',
        })
      )
    ).toBe('/explore?list=1');
  });

  it('rewrites stale host overview notification paths to pro membership', () => {
    expect(
      inferNotificationPath(
        notif({ kind: 'host_application_approved', path: '/host/overview' })
      )
    ).toBe('/profile/pro-membership');
  });

  it('routes entity follow publish fan-out to activity detail (S10f)', () => {
    expect(
      inferNotificationPath(
        notif({ kind: 'entity_activity_published', activityId: 'act-published-1' })
      )
    ).toBe('/activity/act-published-1');
  });

  it('routes saved-place wishlist alerts to the published activity', () => {
    expect(
      inferNotificationPath(
        notif({
          kind: 'wishlist_match',
          activityId: 'act-at-saved-place',
          locationId: 'loc-1',
          wishlistItemId: 'wl-1',
        })
      )
    ).toBe('/activity/act-at-saved-place');
  });

  it('rewrites legacy inbox and stale group chat paths to /chat', () => {
    expect(inferNotificationPath(notif({ path: '/messages?to=u-1' }))).toBe('/chat?to=u-1');
    expect(inferNotificationPath(notif({ path: '/host/messages?group=g-1' }))).toBe('/chat?group=g-1');
    expect(
      inferNotificationPath(
        notif({
          kind: 'group_message',
          groupId: 'g-2',
          path: '/groups?group=g-2',
        })
      )
    ).toBe('/chat?group=g-2&chat=1');
    expect(
      inferNotificationPath(
        notif({
          kind: 'group_message',
          activityId: 'act-1',
          path: '/groups?group=g-2',
        })
      )
    ).toBe('/chat?group=g-2&chat=1&activity=act-1');
  });

});
