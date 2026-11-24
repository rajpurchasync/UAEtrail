import { describe, expect, it } from 'vitest';
import type { UserRole } from '@uaetrail/shared-types';
import {
  accountRouteByRole,
  defaultRouteByRole,
  participantHostBookmarkRedirect,
} from './authRouting';
import { isConsumerProfilePath, isPlatformAdminConsolePath } from './roles';

describe('auth routing by role', () => {
  it('maps account routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/profile'],
      ['merchant_admin', '/profile'],
      ['tenant_owner', '/profile'],
      ['tenant_admin', '/profile'],
      ['tenant_guide', '/profile'],
      ['platform_admin', '/admin/account'],
    ];

    for (const [role, expected] of cases) {
      expect(accountRouteByRole(role)).toBe(expected);
    }
  });

  it('treats only /admin paths as the locked admin console', () => {
    expect(isPlatformAdminConsolePath('/admin')).toBe(true);
    expect(isPlatformAdminConsolePath('/admin/inbox')).toBe(true);
    expect(isPlatformAdminConsolePath('/admin/overview')).toBe(true);
    expect(isPlatformAdminConsolePath('/explore')).toBe(false);
    expect(isPlatformAdminConsolePath('/plan')).toBe(false);
    expect(isConsumerProfilePath('/profile')).toBe(true);
    expect(isConsumerProfilePath('/profile/settings')).toBe(true);
    expect(isConsumerProfilePath('/settings')).toBe(false);
    expect(isConsumerProfilePath('/settings/safety')).toBe(false);
    expect(isConsumerProfilePath('/admin/account')).toBe(false);
  });

  it('maps default post-login routes — consumer home is Explore for all non-admin roles', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/explore'],
      ['merchant_admin', '/explore'],
      ['tenant_owner', '/explore'],
      ['tenant_admin', '/explore'],
      ['tenant_guide', '/explore'],
      ['platform_admin', '/admin/inbox'],
    ];

    for (const [role, expected] of cases) {
      expect(defaultRouteByRole(role)).toBe(expected);
    }
  });

  it('maps /publishing bookmarks to profile, plan, or pro membership (not tenant console or compose)', () => {
    expect(participantHostBookmarkRedirect('/publishing/overview')).toBe('/profile');
    expect(participantHostBookmarkRedirect('/publishing/activities')).toMatch(
      /^\/plan\?.*filter=hosting/
    );
    expect(participantHostBookmarkRedirect('/publishing/requests')).toBe('/my-requests');
    expect(participantHostBookmarkRedirect('/publishing/messages')).toBe('/chat');
    expect(participantHostBookmarkRedirect('/publishing/team')).toBe('/profile/pro-membership');
    expect(participantHostBookmarkRedirect('/publishing/places')).toBe('/organisation/manage');
  });

  it('maps stale /host console bookmarks via shared-types canonicalize', () => {
    expect(participantHostBookmarkRedirect('/host/activities')).toMatch(/^\/plan\?.*filter=hosting/);
    expect(participantHostBookmarkRedirect('/host/overview')).toBe('/profile/pro-membership');
    expect(participantHostBookmarkRedirect('/hosting/requests')).toBe('/my-requests');
    expect(participantHostBookmarkRedirect('/hosting/messages')).toBe('/chat');
  });
});