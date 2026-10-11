import { describe, expect, it } from 'vitest';
import { applyActivityViewEntitlements } from '../src/services/member-entitlements.js';

const socialAccess = {
  exposure: 'full' as const,
  level: 'participant' as const,
  gateReason: null,
  canViewFullActivity: true,
  canOpenDetailPage: true,
  joinMode: 'open' as const,
  canAccessCrewSurfaces: true,
};

describe('applyActivityViewEntitlements', () => {
  it('passthrough social access until paid SKU rules ship', () => {
    const result = applyActivityViewEntitlements(
      { viewerUserId: 'u1', hostStatus: null },
      socialAccess
    );
    expect(result).toEqual(socialAccess);
  });

  it('does not strip crew surfaces for hosts without billing snapshot', () => {
    const result = applyActivityViewEntitlements(
      {
        viewerUserId: 'host-1',
        hostStatus: {
          signupProfileComplete: true,
          hostTiers: { community: true, professional: false, business: false },
          isCommunityHost: true,
          canPublish: true,
          canHostPaidActivities: false,
          canAccessHostConsole: true,
          publishingPurpose: 'community',
          tenantId: 't1',
        },
      },
      socialAccess
    );
    expect(result.canAccessCrewSurfaces).toBe(true);
  });
});
