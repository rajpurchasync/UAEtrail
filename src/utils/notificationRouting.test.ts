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
    ).toBe('/groups?group=g-1');
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
