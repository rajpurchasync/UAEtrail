import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authenticator } from '@otplib/preset-default';
import { UserRole } from '../src/domain/enums.js';
import { assertPlatformAdminMfaIfRequired, isPlatformAdminMfaRequired } from '../src/lib/platform-admin-mfa.js';

describe('platform admin MFA (S10g)', () => {
  it('is off without PLATFORM_ADMIN_MFA_SECRET', () => {
    expect(isPlatformAdminMfaRequired()).toBe(false);
    expect(() =>
      assertPlatformAdminMfaIfRequired({ role: UserRole.PLATFORM_ADMIN, totp: undefined })
    ).not.toThrow();
  });

  it('requires valid TOTP when secret is set', () => {
    const prev = process.env.PLATFORM_ADMIN_MFA_SECRET;
    const secret = authenticator.generateSecret();
    process.env.PLATFORM_ADMIN_MFA_SECRET = secret;
    try {
      expect(isPlatformAdminMfaRequired()).toBe(true);
      expect(() =>
        assertPlatformAdminMfaIfRequired({ role: UserRole.PLATFORM_ADMIN, totp: undefined })
      ).toThrow();
      const code = authenticator.generate(secret);
      expect(() =>
        assertPlatformAdminMfaIfRequired({ role: UserRole.PLATFORM_ADMIN, totp: code })
      ).not.toThrow();
    } finally {
      if (prev === undefined) delete process.env.PLATFORM_ADMIN_MFA_SECRET;
      else process.env.PLATFORM_ADMIN_MFA_SECRET = prev;
    }
  });
});

describe('CSP boot scripts (W1)', () => {
  it('index.html script-src does not allow unsafe-inline', () => {
    const html = readFileSync(join(process.cwd(), '../../index.html'), 'utf8');
    expect(html).toMatch(/script-src 'self' https:\/\/accounts\.google\.com/);
    expect(html).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(html).toMatch(/\/boot\/theme\.js/);
  });
});
