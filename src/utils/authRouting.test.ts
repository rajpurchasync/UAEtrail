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
      ['tenant_owner', '/publishing/overview'],
      ['tenant_admin', '/publishing/overview'],
      ['tenant_guide', '/publishing/overview'],
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
    expect(hostDashboardRedirect('requests')).toBe('/publishing/requests');
    expect(hostDashboardRedirect('activities')).toBe('/publishing/activities');
    expect(hostDashboardRedirect('profile')).toBe('/publishing/profile');
    expect(hostDashboardRedirect('unknown')).toBe('/publishing/overview');
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

  it('maps /operator bookmarks to Plan, explore organize, or pro membership (not tenant console)', () => {
    expect(participantHostBookmarkRedirect('/operator/overview')).toBe('/explore?compose=host');
    expect(participantHostBookmarkRedirect('/operator/activities')).toBe('/plan?view=plans&filter=hosting');
    expect(participantHostBookmarkRedirect('/operator/requests')).toBe('/my-requests');
    expect(participantHostBookmarkRedirect('/operator/messages')).toBe('/chat');
    expect(participantHostBookmarkRedirect('/operator/team')).toBe('/profile/pro-membership');
    expect(participantHostBookmarkRedirect('/operator/places')).toBe('/organisation/manage');
  });
});
