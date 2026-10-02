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
      '/trips?segment=upcoming&tab=joined'
    );
    expect(inferNotificationPath(notif({ kind: 'join_request_rejected' }))).toBe(
      '/trips?segment=upcoming&tab=joined'
    );
  });

  it('routes approved join without group chat to My trips', () => {
    expect(inferNotificationPath(notif({ kind: 'join_request_approved' }))).toBe(
      '/trips?segment=upcoming&tab=joined'
    );
    expect(
      inferNotificationPath(
        notif({ kind: 'join_request_approved', groupId: 'g-1' })
      )
    ).toBe('/chat?group=g-1');
  });

  it('routes member goal milestones to profile or trips', () => {
    expect(inferNotificationPath(notif({ kind: 'goal_halfway' }))).toBe('/trips?segment=upcoming');
    expect(inferNotificationPath(notif({ kind: 'goal_complete' }))).toBe('/trips?segment=upcoming');
    expect(inferNotificationPath(notif({ kind: 'goal_behind_pace' }))).toBe(
      '/trips?segment=upcoming&tab=joined'
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

  it('prefers explicit meta.path when present', () => {
    expect(
      inferNotificationPath(
        notif({
          kind: 'join_request_pending',
          path: '/trips?segment=upcoming&tab=joined',
        })
      )
    ).toBe('/trips?segment=upcoming&tab=joined');
  });
});
