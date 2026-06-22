import { describe, expect, it } from 'vitest';
import { resolveAuthRedirect } from './authRedirect';

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
