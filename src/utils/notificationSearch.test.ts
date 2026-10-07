import { describe, expect, it } from 'vitest';
import type { NotificationDTO } from '@uaetrail/shared-types';
import { matchesNotificationSearch } from './notificationSearch';

const base = (overrides: Partial<NotificationDTO>): NotificationDTO => ({
  id: '1',
  title: 'Sunrise hike',
  body: 'Your request was approved',
  type: 'request_update',
  isRead: false,
  createdAt: '2026-01-01T12:00:00.000Z',
  ...overrides,
});

describe('notificationSearch', () => {
  it('matches title and body case-insensitively', () => {
    expect(matchesNotificationSearch(base({}), '')).toBe(true);
    expect(matchesNotificationSearch(base({}), 'hike')).toBe(true);
    expect(matchesNotificationSearch(base({}), 'approved')).toBe(true);
    expect(matchesNotificationSearch(base({}), 'camping')).toBe(false);
  });
});
