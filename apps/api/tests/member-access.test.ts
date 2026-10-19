import { describe, expect, it } from 'vitest';
import {
  memberAudienceMayAttemptHostPublish,
  hostPublishEntitlementDenial,
  resolveMemberAudience,
} from '@uaetrail/shared-types';

const baseHostStatus = {
  profileComplete: true,
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
        hostStatus: { ...baseHostStatus, profileComplete: false },
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

describe('hostPublishEntitlementDenial', () => {
  it('requires sign-in for guests', () => {
    expect(
      hostPublishEntitlementDenial({
        viewerUserId: null,
        hostStatus: null,
        canPublish: false,
      })
    ).toMatchObject({ gateReason: 'sign_in' });
  });

  it('requires profile completion before host / publish', () => {
    expect(
      hostPublishEntitlementDenial({
        viewerUserId: 'u1',
        hostStatus: { ...baseHostStatus, profileComplete: false },
        canPublish: false,
      })
    ).toMatchObject({ gateReason: 'profile_required' });
  });

  it('allows host / publish when canPublish', () => {
    expect(
      hostPublishEntitlementDenial({
        viewerUserId: 'u1',
        hostStatus: baseHostStatus,
        canPublish: true,
      })
    ).toBeNull();
  });
});

describe('memberAudienceMayAttemptHostPublish', () => {
  it('excludes guests and incomplete profiles', () => {
    expect(memberAudienceMayAttemptHostPublish('guest')).toBe(false);
    expect(memberAudienceMayAttemptHostPublish('member_incomplete')).toBe(false);
    expect(memberAudienceMayAttemptHostPublish('member_basic')).toBe(true);
  });
});
