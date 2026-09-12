import { describe, expect, it } from 'vitest';
import type { UserRole } from '@uaetrail/shared-types';
import {
  accountRouteByRole,
  adminDashboardRedirect,
  defaultRouteByRole,
  hostDashboardRedirect,
  merchantDashboardRedirect,
  participantDashboardRedirect,
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
      ['tenant_owner', '/host/overview'],
      ['tenant_admin', '/host/overview'],
      ['tenant_guide', '/host/overview'],
      ['platform_admin', '/admin/overview'],
    ];

    for (const [role, expected] of cases) {
      expect(defaultRouteByRole(role)).toBe(expected);
    }
  });

  it('maps participant dashboard aliases', () => {
    expect(participantDashboardRedirect('overview')).toBe('/profile');
    expect(participantDashboardRedirect('requests')).toBe('/my-requests');
    expect(participantDashboardRedirect('trips')).toBe('/activities?tab=joined');
    expect(participantDashboardRedirect('messages')).toBe('/messages');
    expect(participantDashboardRedirect('profile')).toBe('/profile');
    expect(participantDashboardRedirect('unknown')).toBe('/profile');
  });

  it('maps host dashboard aliases', () => {
    expect(hostDashboardRedirect('messages')).toBe('/host/messages');
    expect(hostDashboardRedirect('requests')).toBe('/host/requests');
    expect(hostDashboardRedirect('trips')).toBe('/host/activities');
    expect(hostDashboardRedirect('activities')).toBe('/host/activities');
    expect(hostDashboardRedirect('profile')).toBe('/host/profile');
    expect(hostDashboardRedirect('unknown')).toBe('/host/overview');
  });

  it('maps admin dashboard aliases', () => {
    expect(adminDashboardRedirect('users')).toBe('/admin/users');
    expect(adminDashboardRedirect('activities')).toBe('/admin/activities');
    expect(adminDashboardRedirect('locations')).toBe('/admin/locations');
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
    expect(merchantDashboardRedirect('overview')).toBe('/shop/manage');
    expect(merchantDashboardRedirect('unknown')).toBe('/shop/manage');
  });
});
