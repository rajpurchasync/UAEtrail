import { describe, expect, it } from 'vitest';
import {
  isSignupProfileGateExemptPath,
  needsSignupProfileGate,
  shouldForceSignupWelcome,
  SIGNUP_PROFILE_WELCOME_PATH,
} from './signupProfileGate';

describe('signupProfileGate', () => {
  it('requires gate for consumer roles only', () => {
    expect(needsSignupProfileGate('participant')).toBe(true);
    expect(needsSignupProfileGate('merchant_admin')).toBe(true);
    expect(needsSignupProfileGate('tenant_owner')).toBe(false);
    expect(needsSignupProfileGate(undefined)).toBe(false);
  });

  it('exempts welcome path only', () => {
    expect(isSignupProfileGateExemptPath(SIGNUP_PROFILE_WELCOME_PATH)).toBe(true);
    expect(isSignupProfileGateExemptPath('/explore')).toBe(false);
  });

  it('forces welcome when gated role profile is incomplete', () => {
    expect(shouldForceSignupWelcome('participant', { dateOfBirth: '1990-01-01' })).toBe(true);
    expect(
      shouldForceSignupWelcome('participant', {
        dateOfBirth: '1990-01-01',
        gender: 'male',
        city: 'dubai',
        languages: 'English',
      })
    ).toBe(false);
    expect(shouldForceSignupWelcome('tenant_owner', null)).toBe(false);
    expect(shouldForceSignupWelcome('merchant_admin', { countryCode: 'AE' })).toBe(true);
  });
});
