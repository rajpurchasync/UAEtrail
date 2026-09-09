import { describe, expect, it, vi } from 'vitest';
import {
  isAuthGatedPath,
  navigateAuthBack,
  navigateAuthClose,
  resolveAuthExitFallback,
  resolveAuthRedirect,
} from './authRedirect';

describe('resolveAuthRedirect', () => {
  it('prefers router state over query param', () => {
    expect(resolveAuthRedirect('/profile', '/trips')).toBe('/profile');
  });

  it('uses redirect query when state is missing', () => {
    expect(resolveAuthRedirect(null, '/trail/abc')).toBe('/trail/abc');
  });

  it('rejects auth loop paths and external URLs', () => {
    expect(resolveAuthRedirect(null, '/signin')).toBeUndefined();
    expect(resolveAuthRedirect(null, '//evil.com')).toBeUndefined();
    expect(resolveAuthRedirect(null, 'https://evil.com')).toBeUndefined();
  });
});

describe('resolveAuthExitFallback', () => {
  it('falls back to explore when redirect is missing or unsafe', () => {
    expect(resolveAuthExitFallback()).toBe('/explore');
    expect(resolveAuthExitFallback('/signin')).toBe('/explore');
    expect(resolveAuthExitFallback('/profile')).toBe('/explore');
  });

  it('keeps public redirect targets', () => {
    expect(resolveAuthExitFallback('/explore')).toBe('/explore');
    expect(resolveAuthExitFallback('/explore?panel=venues')).toBe('/explore?panel=venues');
  });
});

describe('isAuthGatedPath', () => {
  it('detects protected routes', () => {
    expect(isAuthGatedPath('/profile')).toBe(true);
    expect(isAuthGatedPath('/host/overview')).toBe(true);
    expect(isAuthGatedPath('/explore')).toBe(false);
  });
});

describe('navigateAuthBack', () => {
  it('uses browser history when available for public redirects', () => {
    const navigate = vi.fn();
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(3);
    navigateAuthBack(navigate, '/explore?panel=venues');
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it('falls back to explore for gated routes without history', () => {
    const navigate = vi.fn();
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    navigateAuthBack(navigate, '/profile');
    expect(navigate).toHaveBeenCalledWith('/explore', { replace: true });
  });

  it('uses history for gated routes when history exists', () => {
    const navigate = vi.fn();
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    navigateAuthBack(navigate, '/profile');
    expect(navigate).toHaveBeenCalledWith(-1);
  });
});

describe('navigateAuthClose', () => {
  it('replaces to explore by default', () => {
    const navigate = vi.fn();
    navigateAuthClose(navigate);
    expect(navigate).toHaveBeenCalledWith('/explore', { replace: true });
  });

  it('never returns to protected routes', () => {
    const navigate = vi.fn();
    navigateAuthClose(navigate, '/notifications');
    expect(navigate).toHaveBeenCalledWith('/explore', { replace: true });
  });
});
