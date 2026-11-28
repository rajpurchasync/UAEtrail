import { describe, expect, it } from 'vitest';
import { canonicalizeInboundProductPath } from '@uaetrail/shared-types';

describe('notification bookmark migration (shared canonicalize)', () => {
  it('rewrites chat and plan hub bookmarks', () => {
    expect(canonicalizeInboundProductPath('/messages?to=user-1')).toBe('/chat?to=user-1');
    expect(canonicalizeInboundProductPath('/trips?view=plans')).toBe('/plan?view=plans');
    expect(canonicalizeInboundProductPath('/plan?view=plans')).toBe('/plan?view=plans');
  });

  it('rewrites community, crews, and pro entry bookmarks', () => {
    expect(canonicalizeInboundProductPath('/community')).toBe('/explore');
    expect(canonicalizeInboundProductPath('/buddies')).toBe('/crews');
    expect(canonicalizeInboundProductPath('/become-host')).toBe('/profile/pro-membership');
  });

  it('rewrites stale settings and contributions bookmarks', () => {
    expect(canonicalizeInboundProductPath('/profile/settings/privacy')).toBe(
      '/settings/privacy'
    );
    expect(canonicalizeInboundProductPath('/notifications')).toBe('/settings/notifications');
    expect(canonicalizeInboundProductPath('/contributions')).toBe('/profile/submissions');
  });

  it('does not rewrite retired /area hub bookmarks', () => {
    expect(canonicalizeInboundProductPath('/area/hatta')).toBe('/area/hatta');
    expect(canonicalizeInboundProductPath('/area/jebel-jais?tab=goings-on')).toBe(
      '/area/jebel-jais?tab=goings-on'
    );
  });

  it('rewrites stale console and profile history bookmarks', () => {
    expect(canonicalizeInboundProductPath('/publishing/overview')).toBe('/publishing/overview');
    expect(canonicalizeInboundProductPath('/profile/my-trips/map')).toBe('/profile/history/map');
    expect(canonicalizeInboundProductPath('/my-rewards?ref=abc')).toBe('/profile/badges?ref=abc');
  });

  it('rewrites stale entity place bookmarks', () => {
    expect(canonicalizeInboundProductPath('/trail/place-1?tab=facts')).toBe(
      '/place/place-1?tab=facts'
    );
    expect(canonicalizeInboundProductPath('/event/venue-2')).toBe('/venue/venue-2');
  });
});