import { describe, expect, it } from 'vitest';
import {
  organizePublishGateHref,
  organizePublishGateInputFromHostGate,
} from './organizePublishGate';

const signedInInput = (overrides: {
  signupProfileComplete?: boolean;
  canPublish?: boolean;
}) =>
  organizePublishGateInputFromHostGate({
    viewerUserId: 'user-1',
    signupProfileComplete: overrides.signupProfileComplete ?? true,
    canPublish: overrides.canPublish ?? true,
    hostTiers: { community: true, professional: false, business: false },
  });

describe('organizePublishGateHref', () => {
  it('sends guests to sign-in with return path', () => {
    expect(
      organizePublishGateHref(
        '/explore?compose=organize:hiking',
        organizePublishGateInputFromHostGate({
          viewerUserId: null,
          signupProfileComplete: false,
          canPublish: false,
        })
      )
    ).toContain('/signin');
    expect(
      organizePublishGateHref(
        '/explore?compose=organize:hiking',
        organizePublishGateInputFromHostGate({
          viewerUserId: null,
          signupProfileComplete: false,
          canPublish: false,
        })
      )
    ).toContain('redirect');
  });

  it('sends incomplete profiles to welcome with return path', () => {
    expect(
      organizePublishGateHref(
        '/explore?compose=organize:hiking',
        signedInInput({ signupProfileComplete: false, canPublish: false })
      )
    ).toBe('/welcome?redirect=%2Fexplore%3Fcompose%3Dorganize%3Ahiking');
  });

  it('sends complete but blocked users to profile hub', () => {
    expect(
      organizePublishGateHref('/explore', signedInInput({ signupProfileComplete: true, canPublish: false }))
    ).toBe('/profile?redirect=%2Fexplore');
  });
});
