import { describe, expect, it } from 'vitest';
import {
  organizePublishGateHref,
  organizePublishGateInputFromMemberStatus,
} from './organizePublishGate';

const signedInInput = (overrides: {
  profileComplete?: boolean;
  canPublish?: boolean;
}) =>
  organizePublishGateInputFromMemberStatus({
    viewerUserId: 'user-1',
    profileComplete: overrides.profileComplete ?? true,
    canPublish: overrides.canPublish ?? true,
    hostTiers: { community: true, professional: false, business: false },
  });

describe('organizePublishGateHref', () => {
  it('sends guests to sign-in with return path', () => {
    expect(
      organizePublishGateHref(
        '/explore?compose=plan:hiking:hosting',
        organizePublishGateInputFromMemberStatus({
          viewerUserId: null,
          profileComplete: false,
          canPublish: false,
        })
      )
    ).toContain('/signin');
    expect(
      organizePublishGateHref(
        '/explore?compose=plan:hiking:hosting',
        organizePublishGateInputFromMemberStatus({
          viewerUserId: null,
          profileComplete: false,
          canPublish: false,
        })
      )
    ).toContain('redirect');
  });

  it('sends incomplete profiles to welcome with return path', () => {
    expect(
      organizePublishGateHref(
        '/explore?compose=plan:hiking:hosting',
        signedInInput({ profileComplete: false, canPublish: false })
      )
    ).toBe('/welcome?redirect=%2Fexplore%3Fcompose%3Dplan%3Ahiking%3Ahosting');
  });

  it('sends complete but blocked users to profile hub', () => {
    expect(
      organizePublishGateHref('/explore', signedInInput({ profileComplete: true, canPublish: false }))
    ).toBe('/profile?redirect=%2Fexplore');
  });
});
