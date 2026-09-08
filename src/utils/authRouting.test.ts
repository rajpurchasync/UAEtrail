import { describe, expect, it } from 'vitest';
import type { UserRole } from '@uaetrail/shared-types';
import {
  accountRouteByRole,
  adminDashboardRedirect,
  defaultRouteByRole,
  hostDashboardRedirect,
  participantDashboardRedirect,
} from './authRouting';

describe('auth routing by role', () => {
  it('maps account routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/profile'],
      ['merchant_admin', '/merchant/dashboard'],
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
      ['participant', '/'],
      ['merchant_admin', '/merchant/dashboard'],
      ['tenant_owner', '/'],
      ['tenant_admin', '/'],
      ['tenant_guide', '/'],
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
    expect(adminDashboardRedirect('settings')).toBe('/admin/settings');
    expect(adminDashboardRedirect('unknown')).toBe('/admin/overview');
  });
});
