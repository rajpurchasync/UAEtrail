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
  it('attaches entitlements and does not strip crew surfaces', () => {
    const result = applyActivityViewEntitlements(
      { viewerUserId: 'u1', hostStatus: null },
      socialAccess,
      { hostUserId: 'host-1', isFriendOfHost: false, buddyUserIdsOnActivity: [] }
    );
    expect(result.canAccessCrewSurfaces).toBe(true);
    expect(result.entitlements?.isProMember).toBe(false);
    expect(result.entitlements?.canViewFullBuddyRoster).toBe(false);
  });

  it('merges message_host on peek when friend of host pre-join', () => {
    const result = applyActivityViewEntitlements(
      { viewerUserId: 'u1', hostStatus: null },
      {
        ...socialAccess,
        level: 'link_holder',
        canAccessCrewSurfaces: false,
        exposure: 'redacted',
        canViewFullActivity: false,
        mapPeekActions: [
          { id: 'request_join', prominence: 'primary' },
          { id: 'view_detail', prominence: 'text' },
        ],
      },
      { hostUserId: 'host-1', isFriendOfHost: true, buddyUserIdsOnActivity: [] }
    );
    expect(result.entitlements?.canMessageHostBeforeJoin).toBe(true);
    expect(result.mapPeekActions?.map((action) => action.id)).toContain('message_host');
  });
});
