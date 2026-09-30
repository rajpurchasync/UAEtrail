import { describe, expect, it } from 'vitest';
import { firstIncompleteSignupStep, isSignupProfileComplete } from './signupProfileSteps';

describe('signupProfileSteps', () => {
  it('detects incomplete steps in order', () => {
    expect(firstIncompleteSignupStep(null)).toBe('dateOfBirth');
    expect(firstIncompleteSignupStep({ dateOfBirth: '1990-01-01' })).toBe('gender');
    expect(
      firstIncompleteSignupStep({
        dateOfBirth: '1990-01-01',
        gender: 'female',
      })
    ).toBe('countryCode');
    expect(
      firstIncompleteSignupStep({
        dateOfBirth: '1990-01-01',
        gender: 'female',
        countryCode: 'AE',
      })
    ).toBe('countryCode');
  });

  it('requires DOB, gender, and based-in country for signup complete (not languages)', () => {
    expect(
      isSignupProfileComplete({
        dateOfBirth: '1990-01-01',
        gender: 'male',
      })
    ).toBe(false);
    expect(
      isSignupProfileComplete({
        dateOfBirth: '1990-01-01',
        gender: 'male',
        countryCode: 'AE',
      })
    ).toBe(true);
    expect(
      isSignupProfileComplete({
        dateOfBirth: '1990-01-01',
        gender: 'male',
        city: 'dubai',
      })
    ).toBe(true);
  });
});
