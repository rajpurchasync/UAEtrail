import { describe, expect, it } from 'vitest';
import type { UserRole } from '@uaetrail/shared-types';
import {
  accountRouteByRole,
  adminDashboardRedirect,
  defaultRouteByRole,
  organizerDashboardRedirect,
  participantDashboardRedirect,
} from './authRouting';

describe('auth routing by role', () => {
  it('maps account routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['participant', '/profile'],
      ['merchant_admin', '/merchant/dashboard'],
      ['tenant_owner', '/host/overview'],
      ['tenant_admin', '/host/overview'],
      ['tenant_guide', '/host/overview'],
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
    expect(participantDashboardRedirect('trips')).toBe('/activities?tab=mine');
    expect(participantDashboardRedirect('messages')).toBe('/messages');
    expect(participantDashboardRedirect('profile')).toBe('/profile');
    expect(participantDashboardRedirect('unknown')).toBe('/profile');
  });

  it('maps organizer dashboard aliases', () => {
    expect(organizerDashboardRedirect('messages')).toBe('/host/messages');
    expect(organizerDashboardRedirect('requests')).toBe('/host/requests');
    expect(organizerDashboardRedirect('trips')).toBe('/host/activities');
    expect(organizerDashboardRedirect('activities')).toBe('/host/activities');
    expect(organizerDashboardRedirect('profile')).toBe('/host/profile');
    expect(organizerDashboardRedirect('unknown')).toBe('/host/overview');
  });

  it('maps admin dashboard aliases', () => {
    expect(adminDashboardRedirect('users')).toBe('/admin/users');
    expect(adminDashboardRedirect('activities')).toBe('/admin/activities');
    expect(adminDashboardRedirect('locations')).toBe('/admin/locations');
    expect(adminDashboardRedirect('settings')).toBe('/admin/settings');
    expect(adminDashboardRedirect('unknown')).toBe('/admin/overview');
  });
});
