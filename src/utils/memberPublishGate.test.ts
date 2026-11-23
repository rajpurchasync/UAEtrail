import { describe, expect, it } from 'vitest';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from './memberPublishGate';

const signedInInput = (overrides: {
  profileComplete?: boolean;
  guideProfileComplete?: boolean;
  canPublish?: boolean;
}) =>
  memberPublishGateInputFromMemberStatus({
    viewerUserId: 'user-1',
    profileComplete: overrides.profileComplete ?? true,
    guideProfileComplete: overrides.guideProfileComplete ?? true,
    canPublish: overrides.canPublish ?? true,
    hostTiers: { community: true, professional: false, business: false },
  });

describe('memberPublishGateHref', () => {
  it('sends guests to sign-in with return path', () => {
    expect(
      memberPublishGateHref(
        '/explore?compose=host:hiking',
        memberPublishGateInputFromMemberStatus({
          viewerUserId: null,
          profileComplete: false,
          guideProfileComplete: false,
          canPublish: false,
        })
      )
    ).toContain('/signin');
    expect(
      memberPublishGateHref(
        '/explore?compose=host:hiking',
        memberPublishGateInputFromMemberStatus({
          viewerUserId: null,
          profileComplete: false,
          guideProfileComplete: false,
          canPublish: false,
        })
      )
    ).toContain('redirect');
  });

  it('sends incomplete profiles to welcome with return path', () => {
    expect(
      memberPublishGateHref(
        '/explore?compose=host:hiking',
        signedInInput({ profileComplete: false, canPublish: false })
      )
    ).toBe('/welcome?redirect=%2Fexplore%3Fcompose%3Dhost%3Ahiking');
  });

  it('sends signup-complete users without guide profile to /profile/guide', () => {
    expect(
      memberPublishGateHref(
        '/explore?compose=host:hiking',
        signedInInput({ profileComplete: true, guideProfileComplete: false, canPublish: false })
      )
    ).toBe('/profile/guide?redirect=%2Fexplore%3Fcompose%3Dhost%3Ahiking');
  });

  it('sends complete but blocked users to profile hub', () => {
    expect(
      memberPublishGateHref('/explore', signedInInput({ profileComplete: true, canPublish: false }))
    ).toBe('/profile?redirect=%2Fexplore');
  });
});
