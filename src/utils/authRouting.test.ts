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

  it('maps default post-login routes — consumer home is /home for all non-admin roles', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/home'],
      ['merchant_admin', '/home'],
      ['tenant_owner', '/home'],
      ['tenant_admin', '/home'],
      ['tenant_guide', '/home'],
      ['platform_admin', '/admin/inbox'],
    ];

    for (const [role, expected] of cases) {
      expect(defaultRouteByRole(role)).toBe(expected);
    }
  });

  it('maps /operator bookmarks to profile, plan, or pro membership (not tenant console or compose)', () => {
    expect(participantHostBookmarkRedirect('/operator/overview')).toBe('/profile');
    expect(participantHostBookmarkRedirect('/operator/activities')).toMatch(
      /^\/plan\?.*filter=hosting/
    );
    expect(participantHostBookmarkRedirect('/operator/requests')).toBe('/my-requests');
    expect(participantHostBookmarkRedirect('/operator/messages')).toBe('/chat');
    expect(participantHostBookmarkRedirect('/operator/team')).toBe('/profile/pro-membership');
    expect(participantHostBookmarkRedirect('/operator/places')).toBe('/operator/profile');
    expect(participantHostBookmarkRedirect('/operator/profile')).toBe('/operator/profile');
  });

  it('maps stale /host console bookmarks via shared-types canonicalize', () => {
    expect(participantHostBookmarkRedirect('/host/activities')).toMatch(/^\/plan\?.*filter=hosting/);
    expect(participantHostBookmarkRedirect('/host/overview')).toBe('/profile/pro-membership');
    expect(participantHostBookmarkRedirect('/hosting/requests')).toBe('/my-requests');
    expect(participantHostBookmarkRedirect('/hosting/messages')).toBe('/chat');
  });
});