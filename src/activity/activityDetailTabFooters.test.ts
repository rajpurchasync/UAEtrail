import { describe, expect, it } from 'vitest';
import { resolveActivityDetailTabFooterKind } from './activityDetailTabFooters';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

const openJoin: JoinRequestUiState = { kind: 'open' };

const base = {
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

describe('resolveActivityDetailTabFooterKind', () => {
  it('uses directions on Place when crew can see coordinates', () => {
    expect(resolveActivityDetailTabFooterKind({ ...base, tab: 'place' })).toBe('place_directions');
  });

  it('falls back to plan join on Place when locked', () => {
    expect(
      resolveActivityDetailTabFooterKind({
        ...base,
        tab: 'place',
        canAccessCrewSurfaces: false,
      })
    ).toBe('plan_join');
  });

  it('uses invite on Buddies for confirmed participants', () => {
    expect(resolveActivityDetailTabFooterKind({ ...base, tab: 'buddies' })).toBe('buddies_invite');
  });

  it('uses linked ride on Transport when listing exists', () => {
    expect(
      resolveActivityDetailTabFooterKind({
        ...base,
        tab: 'transport',
        linkedRideshareId: 'ride-1',
      })
    ).toBe('transport_linked_ride');
  });

  it('host share on Buddies tab', () => {
    expect(
      resolveActivityDetailTabFooterKind({
        ...base,
        tab: 'buddies',
        isHostUser: true,
      })
    ).toBe('plan_host_share');
  });
});
