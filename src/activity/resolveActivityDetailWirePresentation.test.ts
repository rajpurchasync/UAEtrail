import { describe, expect, it } from 'vitest';
import { resolveActivityDetailWirePresentation } from './resolveActivityDetailWirePresentation';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

const guestAccess = {
  exposure: 'redacted' as const,
  level: 'public' as const,
  gateReason: 'sign_in' as const,
  canViewFullActivity: false,
  canOpenDetailPage: true,
  joinMode: 'open' as const,
  canAccessCrewSurfaces: false,
};

describe('resolveActivityDetailWirePresentation', () => {
  it('returns footerByTab + tabs from L1 policy', () => {
    const openJoin: JoinRequestUiState = { kind: 'open' };
    const presentation = resolveActivityDetailWirePresentation({
      activity: {
        status: 'published',
        participationMode: 'approval',
        requirements: ['Host approval required to join'],
        joinMode: 'open',
        participants: [],
      },
      viewerAccess: guestAccess,
      isHostUser: false,
      joinUiState: openJoin,
    });

    expect(presentation?.footerByTab.plan).toBe('plan_join');
    expect(presentation?.tabs.plan.useTabChrome).toBe(true);
    expect(presentation?.engagement.joinEngagement).toBe('open');
  });

  it('returns null without viewerAccess', () => {
    expect(
      resolveActivityDetailWirePresentation({
        activity: { status: 'draft', joinMode: 'open', participants: [] },
        viewerAccess: null,
        isHostUser: true,
        joinUiState: { kind: 'open' },
      })
    ).toBeNull();
  });
});
