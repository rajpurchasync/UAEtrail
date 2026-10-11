import { describe, expect, it } from 'vitest';
import {
  detailPlanFooterKindForPeekPrimary,
  resolveActivityDetailEngagementFooterKind,
} from './resolveActivityDetailEngagement';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

const openJoin: JoinRequestUiState = { kind: 'open' };

const tabFooterBase = {
  isHostUser: false,
  isEmbedded: false,
  previewMode: false,
  canAccessCrewSurfaces: true,
  joinUiState: openJoin,
  hasMeetingCoordinates: true,
  linkedRideshareId: null,
  rideshareEnabled: false,
  showParticipantFooterShortcuts: true,
};

describe('resolveActivityDetailEngagement', () => {
  it('maps peek primary ids to detail footer kinds', () => {
    expect(detailPlanFooterKindForPeekPrimary('invite_crew')).toBe('buddies_invite');
    expect(detailPlanFooterKindForPeekPrimary('request_join')).toBe('plan_join');
  });

  it('uses tab footer resolver on activity_detail surface', () => {
    expect(
      resolveActivityDetailEngagementFooterKind({
        surface: 'activity_detail',
        tab: 'place',
        tabFooter: tabFooterBase,
      })
    ).toBe('place_directions');
  });

  it('uses peek mapping on explore_map surface', () => {
    expect(
      resolveActivityDetailEngagementFooterKind({
        surface: 'explore_map',
        tabFooter: tabFooterBase,
        peekPrimaryActionId: 'link_carpool',
      })
    ).toBe('transport_linked_ride');
  });
});
