import { describe, expect, it } from 'vitest';
import { firstIncompleteSignupStep, isSignupProfileComplete } from './signupProfileSteps';

describe('signupProfileSteps', () => {
  it('detects incomplete steps in order', () => {
    expect(firstIncompleteSignupStep(null)).toBe('dateOfBirth');
    expect(firstIncompleteSignupStep({ dateOfBirth: '1990-01-01' })).toBe('gender');
    expect(firstIncompleteSignupStep({ dateOfBirth: '1990-01-01', gender: 'female' })).toBe('languages');
    expect(
      firstIncompleteSignupStep({
        dateOfBirth: '1990-01-01',
        gender: 'female',
        languages: 'English',
      })
    ).toBe('countryCode');
  });

  it('requires languages and country for signup complete', () => {
    expect(
      isSignupProfileComplete({
        dateOfBirth: '1990-01-01',
        gender: 'male',
        countryCode: 'AE',
      })
    ).toBe(false);
    expect(
      isSignupProfileComplete({
        dateOfBirth: '1990-01-01',
        gender: 'male',
        countryCode: 'AE',
        languages: 'English, Arabic',
      })
    ).toBe(true);
    expect(
      isSignupProfileComplete({
        dateOfBirth: '1990-01-01',
        gender: 'male',
        city: 'dubai',
        languages: 'English',
      })
    ).toBe(true);
  });
});
