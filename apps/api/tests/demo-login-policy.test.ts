import { describe, expect, it } from 'vitest';
import { isDemoLoginAllowedForRequest, isLoopbackAddress } from '../src/lib/demo-login-policy.js';

describe('demo-login-policy', () => {
  it('never allows demo login in production', () => {
    expect(
      isDemoLoginAllowedForRequest('production', '127.0.0.1', 'true')
    ).toBe(false);
  });

  it('allows demo login in test', () => {
    expect(isDemoLoginAllowedForRequest('test', undefined)).toBe(true);
  });

  it('development allows loopback peer only unless ALLOW_DEMO_LOGIN', () => {
    expect(isDemoLoginAllowedForRequest('development', '127.0.0.1')).toBe(true);
    expect(isDemoLoginAllowedForRequest('development', '::ffff:127.0.0.1')).toBe(true);
    expect(isDemoLoginAllowedForRequest('development', '10.0.0.5')).toBe(false);
    expect(isDemoLoginAllowedForRequest('development', '10.0.0.5', 'true')).toBe(true);
  });

  it('isLoopbackAddress ignores spoofed host strings', () => {
    expect(isLoopbackAddress('localhost')).toBe(false);
  });
});
