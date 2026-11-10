import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS,
  isNotificationDndActive,
  mergeNotificationPreferenceSettings,
  resolveNotificationPreferenceTopic,
  shouldDeliverNotification,
} from './notification-preferences.js';

describe('notification preferences', () => {
  it('merges partial settings', () => {
    const merged = mergeNotificationPreferenceSettings({
      topics: { plans: { email: false, push: true, inApp: true } },
    });
    expect(merged.topics.plans.email).toBe(false);
    expect(merged.topics.social.push).toBe(true);
  });

  it('detects schedule DND', () => {
    expect(
      isNotificationDndActive(
        { mode: 'schedule', fromDate: '2020-01-01', toDate: '2030-01-01' },
        new Date('2026-06-01')
      )
    ).toBe(true);
    expect(
      isNotificationDndActive(
        { mode: 'schedule', fromDate: '2030-01-01', toDate: '2031-01-01' },
        new Date('2026-06-01')
      )
    ).toBe(false);
  });

  it('maps kinds to topics', () => {
    expect(resolveNotificationPreferenceTopic('wishlist_match')).toBe('map_alerts');
    expect(resolveNotificationPreferenceTopic('connection_buddy_request')).toBe('social');
    expect(resolveNotificationPreferenceTopic('join_request_pending')).toBe('plans');
  });

  it('honors channel toggles', () => {
    const prefs = mergeNotificationPreferenceSettings({
      topics: { social: { email: false, push: false, inApp: true } },
    });
    expect(
      shouldDeliverNotification({ prefs, topic: 'social', channel: 'push' })
    ).toBe(false);
    expect(
      shouldDeliverNotification({ prefs, topic: 'social', channel: 'inApp' })
    ).toBe(true);
  });

  it('defaults are permissive', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS.dnd.mode).toBe('off');
  });
});
