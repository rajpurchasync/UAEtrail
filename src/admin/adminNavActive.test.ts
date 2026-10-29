import { describe, expect, it } from 'vitest';
import { isAdminConsoleNavActive } from './adminNavActive';

describe('isAdminConsoleNavActive', () => {
  it('matches exact paths and nested segments', () => {
    expect(isAdminConsoleNavActive('/admin/overview', '/admin/overview')).toBe(true);
    expect(isAdminConsoleNavActive('/admin/users/extra', '/admin/users')).toBe(true);
    expect(isAdminConsoleNavActive('/admin/user', '/admin/users')).toBe(false);
    expect(isAdminConsoleNavActive('/admin/places', '/admin/facilities')).toBe(false);
  });
});
