import { describe, expect, it } from 'vitest';
import {
  memberAudienceMayAttemptOrganize,
  organizeEntitlementDenial,
  resolveMemberAudience,
} from '@uaetrail/shared-types';

const baseHostStatus = {
  signupProfileComplete: true,
  isCommunityHost: false,
  hostTiers: { community: true, professional: false, business: false },
};

describe('resolveMemberAudience', () => {
  it('classifies guests', () => {
    expect(resolveMemberAudience({ viewerUserId: null, hostStatus: null })).toBe('guest');
  });

  it('classifies incomplete profile members', () => {
    expect(
      resolveMemberAudience({
        viewerUserId: 'u1',
        hostStatus: { ...baseHostStatus, signupProfileComplete: false },
      })
    ).toBe('member_incomplete');
  });

  it('classifies profile-complete basic members', () => {
    expect(
      resolveMemberAudience({ viewerUserId: 'u1', hostStatus: baseHostStatus })
    ).toBe('member_basic');
  });

  it('prefers business tier over basic', () => {
    expect(
      resolveMemberAudience({
        viewerUserId: 'u1',
        hostStatus: {
          ...baseHostStatus,
          hostTiers: { community: true, professional: false, business: true },
        },
      })
    ).toBe('member_business');
  });
});

describe('organizeEntitlementDenial', () => {
  it('requires sign-in for guests', () => {
    expect(
      organizeEntitlementDenial({
        viewerUserId: null,
        hostStatus: null,
        canPublish: false,
      })
    ).toMatchObject({ gateReason: 'sign_in' });
  });

  it('requires profile completion before organize', () => {
    expect(
      organizeEntitlementDenial({
        viewerUserId: 'u1',
        hostStatus: { ...baseHostStatus, signupProfileComplete: false },
        canPublish: false,
      })
    ).toMatchObject({ gateReason: 'profile_required' });
  });

  it('allows organize when canPublish', () => {
    expect(
      organizeEntitlementDenial({
        viewerUserId: 'u1',
        hostStatus: baseHostStatus,
        canPublish: true,
      })
    ).toBeNull();
  });
});

describe('memberAudienceMayAttemptOrganize', () => {
  it('excludes guests and incomplete profiles', () => {
    expect(memberAudienceMayAttemptOrganize('guest')).toBe(false);
    expect(memberAudienceMayAttemptOrganize('member_incomplete')).toBe(false);
    expect(memberAudienceMayAttemptOrganize('member_basic')).toBe(true);
  });
});
