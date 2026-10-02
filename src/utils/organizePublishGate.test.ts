import { describe, expect, it } from 'vitest';
import { organizePublishGateHref } from './organizePublishGate';

describe('organizePublishGateHref', () => {
  it('sends incomplete profiles to welcome with return path', () => {
    expect(
      organizePublishGateHref('/explore?compose=organize:hiking', {
        signupProfileComplete: false,
        canPublish: false,
      })
    ).toBe('/welcome?redirect=%2Fexplore%3Fcompose%3Dorganize%3Ahiking');
  });

  it('sends complete but blocked users to profile hub', () => {
    expect(
      organizePublishGateHref('/explore', {
        signupProfileComplete: true,
        canPublish: false,
      })
    ).toBe('/profile?redirect=%2Fexplore');
  });
});
