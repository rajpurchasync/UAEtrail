import { describe, expect, it } from 'vitest';
import { canonicalizeNotificationBookmarkPath } from '@uaetrail/shared-types';

describe('notification bookmark migration (shared canonicalize)', () => {
  it('rewrites chat and plan hub bookmarks', () => {
    expect(canonicalizeNotificationBookmarkPath('/messages?to=user-1')).toBe('/chat?to=user-1');
    expect(canonicalizeNotificationBookmarkPath('/trips?view=plans')).toBe('/plan?view=plans');
    expect(canonicalizeNotificationBookmarkPath('/plan?view=plans')).toBe('/plan?view=plans');
  });

  it('rewrites community, crews, and pro entry bookmarks', () => {
    expect(canonicalizeNotificationBookmarkPath('/community')).toBe('/explore');
    expect(canonicalizeNotificationBookmarkPath('/buddies')).toBe('/crews');
    expect(canonicalizeNotificationBookmarkPath('/become-host')).toBe('/profile/pro-membership');
  });

  it('rewrites stale settings and contributions bookmarks', () => {
    expect(canonicalizeNotificationBookmarkPath('/profile/settings/privacy')).toBe(
      '/settings/privacy'
    );
    expect(canonicalizeNotificationBookmarkPath('/notifications')).toBe('/settings/notifications');
    expect(canonicalizeNotificationBookmarkPath('/contributions')).toBe('/profile/submissions');
  });

  it('rewrites stale console and profile history bookmarks', () => {
    expect(canonicalizeNotificationBookmarkPath('/publishing/overview')).toBe('/operator/overview');
    expect(canonicalizeNotificationBookmarkPath('/profile/my-trips/map')).toBe('/profile/history/map');
    expect(canonicalizeNotificationBookmarkPath('/my-rewards?ref=abc')).toBe('/profile/badges?ref=abc');
  });
});