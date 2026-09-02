import { describe, expect, it } from 'vitest';
import type { UserRole } from '@uaetrail/shared-types';
import {
  accountRouteByRole,
  adminDashboardRedirect,
  defaultRouteByRole,
  organizerDashboardRedirect,
  visitorDashboardRedirect,
} from './authRouting';

describe('auth routing by role', () => {
  it('maps account routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['visitor', '/profile'],
      ['merchant_admin', '/merchant/dashboard'],
      ['tenant_owner', '/organizer/overview'],
      ['tenant_admin', '/organizer/overview'],
      ['tenant_guide', '/organizer/overview'],
      ['platform_admin', '/admin/overview'],
    ];

    for (const [role, expected] of cases) {
      expect(accountRouteByRole(role)).toBe(expected);
    }
  });

  it('maps default post-login routes for each role', () => {
    const cases: Array<[UserRole, string]> = [
      ['visitor', '/'],
      ['merchant_admin', '/merchant/dashboard'],
      ['tenant_owner', '/organizer/overview'],
      ['tenant_admin', '/organizer/overview'],
      ['tenant_guide', '/organizer/overview'],
      ['platform_admin', '/admin/overview'],
    ];

    for (const [role, expected] of cases) {
      expect(defaultRouteByRole(role)).toBe(expected);
    }
  });

  it('maps visitor dashboard aliases', () => {
    expect(visitorDashboardRedirect('overview')).toBe('/profile');
    expect(visitorDashboardRedirect('requests')).toBe('/my-requests');
    expect(visitorDashboardRedirect('trips')).toBe('/activities?tab=mine');
    expect(visitorDashboardRedirect('messages')).toBe('/messages');
    expect(visitorDashboardRedirect('profile')).toBe('/profile');
    expect(visitorDashboardRedirect('unknown')).toBe('/profile');
  });

  it('maps organizer dashboard aliases', () => {
    expect(organizerDashboardRedirect('messages')).toBe('/organizer/messages');
    expect(organizerDashboardRedirect('requests')).toBe('/organizer/requests');
    expect(organizerDashboardRedirect('trips')).toBe('/organizer/activities');
    expect(organizerDashboardRedirect('events')).toBe('/organizer/activities');
    expect(organizerDashboardRedirect('profile')).toBe('/organizer/profile');
    expect(organizerDashboardRedirect('unknown')).toBe('/organizer/overview');
  });

  it('maps admin dashboard aliases', () => {
    expect(adminDashboardRedirect('users')).toBe('/admin/users');
    expect(adminDashboardRedirect('events')).toBe('/admin/activities');
    expect(adminDashboardRedirect('locations')).toBe('/admin/locations');
    expect(adminDashboardRedirect('settings')).toBe('/admin/settings');
    expect(adminDashboardRedirect('unknown')).toBe('/admin/overview');
  });
});
