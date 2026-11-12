import { describe, expect, it } from 'vitest';
import { isAdminConsoleNavActive } from './adminNavActive';

describe('isAdminConsoleNavActive', () => {
  it('matches exact paths and nested segments', () => {
    expect(isAdminConsoleNavActive('/admin/inbox', '/admin/inbox', { exact: true })).toBe(true);
    expect(isAdminConsoleNavActive('/admin/inbox/submissions', '/admin/inbox')).toBe(false);
    expect(isAdminConsoleNavActive('/admin/inbox/submissions', '/admin/inbox/submissions')).toBe(true);
    expect(isAdminConsoleNavActive('/admin/users/extra', '/admin/users')).toBe(true);
    expect(isAdminConsoleNavActive('/admin/user', '/admin/users')).toBe(false);
    expect(isAdminConsoleNavActive('/admin/places', '/admin/facilities')).toBe(false);
  });
});
