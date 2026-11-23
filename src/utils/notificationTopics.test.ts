import { describe, expect, it } from 'vitest';
import type { NotificationDTO } from '@uaetrail/shared-types';
import { inferNotificationTopic, matchesNotificationTopic } from './notificationTopics';

const base = (overrides: Partial<NotificationDTO>): NotificationDTO => ({
  id: '1',
  title: 'Test',
  body: 'Body',
  type: 'system',
  isRead: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  ...overrides,
});

describe('notificationTopics', () => {
  it('maps to Trips · Social · Account buckets', () => {
    expect(inferNotificationTopic(base({ meta: { kind: 'message' } }))).toBe('social');
    expect(inferNotificationTopic(base({ meta: { kind: 'join_request_pending' } }))).toBe('plans');
    expect(inferNotificationTopic(base({ meta: { kind: 'connection_friend_request' } }))).toBe('social');
    expect(inferNotificationTopic(base({ meta: { kind: 'badge' } }))).toBe('account');
    expect(inferNotificationTopic(base({ meta: { kind: 'host_application_approved' } }))).toBe('account');
  });

  it('matches topic filter', () => {
    const notif = base({ meta: { kind: 'group_message' } });
    expect(matchesNotificationTopic(notif, 'all')).toBe(true);
    expect(matchesNotificationTopic(notif, 'social')).toBe(true);
    expect(matchesNotificationTopic(notif, 'plans')).toBe(false);
  });
});
