import { describe, expect, it } from 'vitest';
import type { UserRole } from '@uaetrail/shared-types';
import {
  accountRouteByRole,
  adminDashboardRedirect,
  defaultRouteByRole,
  hostDashboardRedirect,
  merchantDashboardRedirect,
  participantDashboardRedirect,
  participantHostBookmarkRedirect,
} from './authRouting';

describe('auth routing by role', () => {
  it('maps account routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/profile'],
      ['merchant_admin', '/profile'],
      ['tenant_owner', '/profile'],
      ['tenant_admin', '/profile'],
      ['tenant_guide', '/profile'],
      ['platform_admin', '/admin/overview'],
    ];

    for (const [role, expected] of cases) {
      expect(accountRouteByRole(role)).toBe(expected);
    }
  });

  it('maps default post-login routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/explore'],
      ['merchant_admin', '/explore'],
      ['tenant_owner', '/operator/overview'],
      ['tenant_admin', '/operator/overview'],
      ['tenant_guide', '/operator/overview'],
      ['platform_admin', '/admin/overview'],
    ];

    for (const [role, expected] of cases) {
      expect(defaultRouteByRole(role)).toBe(expected);
    }
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
    expect(adminDashboardRedirect('shop')).toBe('/admin/shop');
    expect(adminDashboardRedirect('notifications')).toBe('/admin/notifications');
    expect(adminDashboardRedirect('audit-log')).toBe('/admin/audit-log');
    expect(adminDashboardRedirect('settings')).toBe('/admin/settings');
    expect(adminDashboardRedirect('unknown')).toBe('/admin/overview');
  });

  it('maps merchant dashboard aliases to shop management', () => {
    expect(merchantDashboardRedirect('overview')).toBe('/organisation/manage?kind=shop');
    expect(merchantDashboardRedirect('unknown')).toBe('/organisation/manage?kind=shop');
  });

  it('maps legacy /host bookmarks to Plan, explore organize, or pro membership (not host console)', () => {
    expect(participantHostBookmarkRedirect('/host/overview')).toBe('/explore?compose=organize');
    expect(participantHostBookmarkRedirect('/host/activities')).toBe('/plan?view=plans&filter=hosting');
    expect(participantHostBookmarkRedirect('/host/requests')).toBe('/my-requests');
    expect(participantHostBookmarkRedirect('/host/messages')).toBe('/chat');
    expect(participantHostBookmarkRedirect('/host/team')).toBe('/profile/pro-membership');
    expect(participantHostBookmarkRedirect('/host/places')).toBe('/organisation/manage');
    expect(participantHostBookmarkRedirect('/operator/overview')).toBe('/explore?compose=organize');
    expect(participantHostBookmarkRedirect('/organizer/activities')).toBe('/plan?view=plans&filter=hosting');
  });
});
