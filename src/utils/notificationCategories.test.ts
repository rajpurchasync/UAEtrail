import { describe, expect, it } from 'vitest';
import type { NotificationDTO } from '@uaetrail/shared-types';
import {
  isMessagingNotification,
  isTopCardMessagingNotification,
  sortNotificationsNewestFirst,
} from './notificationCategories';

const base = (overrides: Partial<NotificationDTO>): NotificationDTO => ({
  id: '1',
  title: 'Test',
  body: 'Body',
  type: 'system',
  isRead: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  ...overrides,
});

describe('notificationCategories', () => {
  it('treats direct and group messages as messaging', () => {
    expect(isMessagingNotification(base({ meta: { kind: 'message' } }))).toBe(true);
    expect(isMessagingNotification(base({ meta: { kind: 'group_message' } }))).toBe(true);
  });

  it('top card requires unread messaging', () => {
    expect(
      isTopCardMessagingNotification(base({ meta: { kind: 'message' }, isRead: false }))
    ).toBe(true);
    expect(
      isTopCardMessagingNotification(base({ meta: { kind: 'message' }, isRead: true }))
    ).toBe(false);
    expect(
      isTopCardMessagingNotification(base({ meta: { kind: 'join_request_pending' }, isRead: false }))
    ).toBe(false);
  });

  it('sorts newest first', () => {
    const sorted = sortNotificationsNewestFirst([
      base({ id: 'a', createdAt: '2026-01-01T10:00:00.000Z' }),
      base({ id: 'b', createdAt: '2026-01-02T10:00:00.000Z' }),
    ]);
    expect(sorted.map((n) => n.id)).toEqual(['b', 'a']);
  });
});
