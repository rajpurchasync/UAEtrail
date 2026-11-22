import { describe, expect, it } from 'vitest';
import { computeActivityMapPeekActions } from '@uaetrail/shared-types';
import {
  detailPlanFooterKindForPeekPrimary,
  resolveActivityPeekPrimaryActionId,
  resolveExploreMapEngagementFooterKind,
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

  it('resolveExploreMapEngagementFooterKind mirrors peek primary mapping', () => {
    expect(resolveExploreMapEngagementFooterKind('link_rideshare')).toBe('transport_linked_ride');
    expect(resolveExploreMapEngagementFooterKind('request_join')).toBe('plan_join');
  });

  it('maps host share peek primary and invite_crew to buddies invite footer intent', () => {
    const peek = computeActivityMapPeekActions({ level: 'host', activityPublished: true });
    const primary = resolveActivityPeekPrimaryActionId(peek);
    expect(primary).toBe('share_activity');
    expect(detailPlanFooterKindForPeekPrimary('invite_crew')).toBe('crew_invite');
    expect(detailPlanFooterKindForPeekPrimary('share_activity')).toBe('plan_host_share');
    expect(detailPlanFooterKindForPeekPrimary('open_crew_chat')).toBe('plan_join');
  });
});
