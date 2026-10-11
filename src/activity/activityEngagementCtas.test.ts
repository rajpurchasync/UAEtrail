import { describe, expect, it } from 'vitest';
import { computeActivityMapPeekActions } from '@uaetrail/shared-types';
import {
  detailPlanFooterKindForPeekPrimary,
  resolveActivityPeekPrimaryActionId,
} from './activityEngagementCtas';
import { resolveActivityDetailTabFooterKind } from './activityDetailTabFooters';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

const openJoin: JoinRequestUiState = { kind: 'open' };

describe('activityEngagementCtas', () => {
  it('aligns public peek join with Plan tab join footer', () => {
    const peek = computeActivityMapPeekActions({ level: 'public', activityPublished: true });
    const primary = resolveActivityPeekPrimaryActionId(peek);
    expect(primary).toBe('request_join');
    expect(detailPlanFooterKindForPeekPrimary(primary)).toBe('plan_join');
    expect(
      resolveActivityDetailTabFooterKind({
        tab: 'plan',
        isHostUser: false,
        isEmbedded: false,
        previewMode: false,
        canAccessCrewSurfaces: false,
        joinUiState: openJoin,
        hasMeetingCoordinates: false,
        linkedRideshareId: null,
        rideshareEnabled: false,
        showParticipantFooterShortcuts: false,
      })
    ).toBe('plan_join');
  });

  it('maps host invite_crew peek to buddies invite footer intent', () => {
    const peek = computeActivityMapPeekActions({ level: 'host', activityPublished: true });
    const primary = resolveActivityPeekPrimaryActionId(peek);
    expect(primary).toBe('open_crew_chat');
    expect(detailPlanFooterKindForPeekPrimary('invite_crew')).toBe('buddies_invite');
  });
});
