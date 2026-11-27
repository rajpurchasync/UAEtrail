import { describe, expect, it } from 'vitest';
import { canonicalizeNotificationBookmarkPath, rewriteStaleNotificationBookmarkPath } from './notification-bookmark-path.js';

describe('notification bookmark paths', () => {
  it('rewrites chat and rewards bookmarks', () => {
    expect(rewriteStaleNotificationBookmarkPath('/messages?to=user-1')).toBe('/chat?to=user-1');
    expect(rewriteStaleNotificationBookmarkPath('/hosting/messages')).toBe('/chat');
    expect(rewriteStaleNotificationBookmarkPath('/rewards')).toBe('/profile/badges');
  });

  it('rewrites organisation manage to operator profile desk', () => {
    expect(rewriteStaleNotificationBookmarkPath('/organisation/manage')).toBe('/operator/profile');
    expect(rewriteStaleNotificationBookmarkPath('/organisation/manage?kind=shop')).toBe(
      '/operator/profile?kind=shop'
    );
  });

  it('rewrites community, crews, and pro entry bookmarks', () => {
    expect(rewriteStaleNotificationBookmarkPath('/map?list=1')).toBe('/explore?list=1');
    expect(rewriteStaleNotificationBookmarkPath('/discovery')).toBe('/explore');
    expect(rewriteStaleNotificationBookmarkPath('/community?browse=1')).toBe('/explore?browse=1');
    expect(rewriteStaleNotificationBookmarkPath('/buddies')).toBe('/crews');
    expect(rewriteStaleNotificationBookmarkPath('/become-host')).toBe('/profile/pro-membership');
    expect(rewriteStaleNotificationBookmarkPath('/become-organizer?redirect=%2Fexplore')).toBe(
      '/profile/pro-membership?redirect=%2Fexplore'
    );
  });

  it('rewrites profile-nested settings and contributions bookmarks', () => {
    expect(rewriteStaleNotificationBookmarkPath('/profile/settings')).toBe('/settings');
    expect(rewriteStaleNotificationBookmarkPath('/profile/settings/account')).toBe(
      '/settings/account'
    );
    expect(rewriteStaleNotificationBookmarkPath('/notifications/history')).toBe(
      '/settings/notifications/history'
    );
    expect(rewriteStaleNotificationBookmarkPath('/contributions')).toBe('/profile/submissions');
    expect(rewriteStaleNotificationBookmarkPath('/profile/wishlist')).toBe(
      '/plan?view=plans&tab=wishlist'
    );
  });

  it('canonicalizes plan hub queries', () => {
    expect(canonicalizeNotificationBookmarkPath('/trips?segment=upcoming&tab=joined')).toBe(
      '/plan?view=plans&filter=joined'
    );
    expect(canonicalizeNotificationBookmarkPath('/trips?segment=wishlist')).toBe(
      '/plan?view=plans&tab=wishlist'
    );
    expect(canonicalizeNotificationBookmarkPath('/profile/my-trips')).toBe('/profile/history');
    expect(canonicalizeNotificationBookmarkPath('/hosting?tab=upcoming')).toBe(
      '/operator/overview?tab=upcoming'
    );
  });
});