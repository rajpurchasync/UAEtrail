import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recordNavigation, resetBackStack } from './backStack';
import {
  canReturnAfterAuth,
  isAuthGatedPath,
  isRejectedAuthRedirectParam,
  navigateAuthBack,
  navigateAuthClose,
  resolveAuthExitFallback,
  resolveAuthRedirect,
} from './authRedirect';

describe('canReturnAfterAuth', () => {
  it('allows any role to return to public explore map URLs', () => {
    expect(canReturnAfterAuth('/explore?compose=1', 'tenant_owner')).toBe(true);
    expect(canReturnAfterAuth('/explore?list=1', 'participant')).toBe(true);
  });

  it('blocks host roles from returning to admin routes', () => {
    expect(canReturnAfterAuth('/admin/overview', 'tenant_owner')).toBe(false);
  });

  it('blocks participants from admin but allows operator redirect targets', () => {
    expect(canReturnAfterAuth('/admin/overview', 'participant')).toBe(false);
    expect(canReturnAfterAuth('/operator/overview', 'participant')).toBe(true);
    expect(canReturnAfterAuth('/publishing/overview', 'participant')).toBe(true);
    expect(canReturnAfterAuth('/profile', 'participant')).toBe(true);
  });
});

describe('resolveAuthRedirect', () => {
  it('prefers router state over query param', () => {
    expect(resolveAuthRedirect('/profile', '/activities')).toBe('/profile');
  });

  it('uses redirect query when state is missing', () => {
    expect(resolveAuthRedirect(null, '/trail/abc')).toBe('/trail/abc');
  });

  it('rejects auth loop paths and external URLs', () => {
    expect(resolveAuthRedirect(null, '/signin')).toBeUndefined();
    expect(resolveAuthRedirect(null, '//evil.com')).toBeUndefined();
    expect(resolveAuthRedirect(null, 'https://evil.com')).toBeUndefined();
  });

  it('keeps guest home as a dismiss parent', () => {
    expect(resolveAuthRedirect(null, '/')).toBe('/');
  });

  it('strips session=expired so login does not re-show the toast', () => {
    expect(resolveAuthRedirect(null, '/explore?session=expired')).toBe('/explore');
    expect(resolveAuthRedirect('/explore?session=expired&list=1', null)).toBe('/explore?list=1');
  });

  it('flags unsafe redirect query params', () => {
    expect(isRejectedAuthRedirectParam('/signin')).toBe(true);
    expect(isRejectedAuthRedirectParam('https://evil.com')).toBe(true);
    expect(isRejectedAuthRedirectParam('/explore')).toBe(false);
    expect(isRejectedAuthRedirectParam(null)).toBe(false);
  });
});

describe('resolveAuthExitFallback', () => {
  it('falls back to guest home when redirect is missing or unsafe', () => {
    expect(resolveAuthExitFallback()).toBe('/');
    expect(resolveAuthExitFallback('/signin')).toBe('/');
    expect(resolveAuthExitFallback('/profile')).toBe('/');
  });

  it('keeps public redirect targets', () => {
    expect(resolveAuthExitFallback('/explore')).toBe('/explore');
    expect(resolveAuthExitFallback('/explore?panel=venues')).toBe('/explore?panel=venues');
  });
});

describe('isAuthGatedPath', () => {
  it('detects protected routes', () => {
    expect(isAuthGatedPath('/profile')).toBe(true);
    expect(isAuthGatedPath('/publishing/overview')).toBe(true);
    expect(isAuthGatedPath('/explore')).toBe(false);
  });
});

describe('navigateAuthBack', () => {
  beforeEach(() => {
    resetBackStack();
    window.history.replaceState(null, '', '/signin');
  });

  it('pops to the in-app screen that opened sign-in', () => {
    recordNavigation('k1', '/explore?panel=venues', 'POP');
    recordNavigation('k2', '/signin', 'PUSH');
    const navigate = vi.fn();
    navigateAuthBack(navigate, '/explore?panel=venues');
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it('falls back to guest home for gated routes without in-app history', () => {
    recordNavigation('k1', '/signin', 'POP');
    const navigate = vi.fn();
    navigateAuthBack(navigate, '/profile');
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('skips the sign-up step underneath and returns to the opener', () => {
    recordNavigation('k1', '/activity/abc', 'POP');
    recordNavigation('k2', '/signup', 'PUSH');
    recordNavigation('k3', '/signin', 'PUSH');
    const navigate = vi.fn();
    navigateAuthBack(navigate, '/profile');
    expect(navigate).toHaveBeenCalledWith(-2);
  });
});

describe('navigateAuthClose', () => {
  beforeEach(() => {
    resetBackStack();
    window.history.replaceState(null, '', '/signin');
  });

  it('returns to the opener when in-app history exists', () => {
    recordNavigation('k1', '/shop/abc', 'POP');
    recordNavigation('k2', '/signin', 'PUSH');
    const navigate = vi.fn();
    navigateAuthClose(navigate, '/shop/abc');
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it('never returns to protected routes', () => {
    recordNavigation('k1', '/signin', 'POP');
    const navigate = vi.fn();
    navigateAuthClose(navigate, '/notifications');
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
