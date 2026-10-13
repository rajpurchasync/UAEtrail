import { describe, expect, it, vi } from 'vitest';
import { composeActivityViewerAccess } from '../src/services/compose-activity-viewer-access.js';
import * as activityViewerAccess from '../src/services/activity-viewer-access.js';
import * as memberEntitlements from '../src/services/member-entitlements.js';

describe('composeActivityViewerAccess', () => {
  it('pipes social access through entitlements', async () => {
    const social = {
      exposure: 'redacted' as const,
      level: 'public' as const,
      gateReason: 'sign_in' as const,
      canViewFullActivity: false,
      canOpenDetailPage: true,
      joinMode: 'open' as const,
      canAccessCrewSurfaces: false,
    };
    vi.spyOn(activityViewerAccess, 'buildActivityViewerAccess').mockResolvedValue(social);
    const entitlementsSpy = vi
      .spyOn(memberEntitlements, 'applyActivityViewEntitlements')
      .mockReturnValue(social);

    const result = await composeActivityViewerAccess(
      {
        viewerUserId: null,
        activity: {
          id: 'a1',
          tenantId: 't1',
          hostId: 'h1',
          createdById: 'h1',
          joinMode: 'open',
        },
      },
      { viewerUserId: null, hostStatus: null }
    );

    expect(result).toEqual(social);
    expect(entitlementsSpy).toHaveBeenCalledWith(
      { viewerUserId: null, hostStatus: null },
      social,
      undefined
    );
    vi.restoreAllMocks();
  });
});
