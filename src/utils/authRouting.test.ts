import { describe, expect, it } from 'vitest';
import type { UserRole } from '@uaetrail/shared-types';
import {
  accountRouteByRole,
  adminDashboardRedirect,
  defaultRouteByRole,
  hostDashboardRedirect,
  hostModeHomeRouteByRole,
  merchantDashboardRedirect,
  participantDashboardRedirect,
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

  it('maps default post-login routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/explore'],
      ['merchant_admin', '/explore'],
      ['tenant_owner', '/operator/overview'],
      ['tenant_admin', '/operator/overview'],
      ['tenant_guide', '/operator/overview'],
      ['platform_admin', '/admin/inbox'],
    ];

    for (const [role, expected] of cases) {
      expect(defaultRouteByRole(role)).toBe(expected);
    }
  });

  it('maps host-mode home to publishing overview for console roles', () => {
    expect(hostModeHomeRouteByRole('tenant_owner')).toBe('/operator/overview');
    expect(hostModeHomeRouteByRole('tenant_guide')).toBe('/operator/overview');
    expect(hostModeHomeRouteByRole('participant')).toBe('/explore');
  });

  it('maps participant dashboard aliases', () => {
    expect(participantDashboardRedirect('overview')).toBe('/profile');
    expect(participantDashboardRedirect('requests')).toBe('/my-requests');
    expect(participantDashboardRedirect('activities')).toBe('/plan');
    expect(participantDashboardRedirect('messages')).toBe('/chat');
    expect(participantDashboardRedirect('profile')).toBe('/profile');
    expect(participantDashboardRedirect('unknown')).toBe('/profile');
  });

  it('maps host dashboard aliases', () => {
    expect(hostDashboardRedirect('messages')).toBe('/chat');
    expect(hostDashboardRedirect('requests')).toBe('/operator/requests');
    expect(hostDashboardRedirect('activities')).toBe('/operator/activities');
    expect(hostDashboardRedirect('profile')).toBe('/operator/profile');
    expect(hostDashboardRedirect('unknown')).toBe('/operator/overview');
  });

  it('maps admin dashboard aliases', () => {
    expect(adminDashboardRedirect('users')).toBe('/admin/users');
    expect(adminDashboardRedirect('activities')).toBe('/admin/activities');
    expect(adminDashboardRedirect('locations')).toBe('/admin/places');
    expect(adminDashboardRedirect('places')).toBe('/admin/places');
    expect(adminDashboardRedirect('hosts')).toBe('/admin/hosts');
    expect(adminDashboardRedirect('organizers')).toBe('/admin/hosts');
    expect(adminDashboardRedirect('groups')).toBe('/admin/groups');
    expect(adminDashboardRedirect('shop')).toBe('/admin/hosts');
    expect(adminDashboardRedirect('notifications')).toBe('/admin/notifications');
    expect(adminDashboardRedirect('audit-log')).toBe('/admin/audit-log');
    expect(adminDashboardRedirect('settings')).toBe('/admin/settings');
    expect(adminDashboardRedirect('account')).toBe('/admin/account');
    expect(adminDashboardRedirect('unknown')).toBe('/admin/inbox');
    expect(adminDashboardRedirect('overview')).toBe('/admin/inbox');
    expect(adminDashboardRedirect('submissions')).toBe('/admin/inbox/submissions');
  });

  it('maps merchant dashboard aliases to shop management', () => {
    expect(merchantDashboardRedirect('overview')).toBe('/organisation/manage?kind=shop');
    expect(merchantDashboardRedirect('unknown')).toBe('/organisation/manage?kind=shop');
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
});
