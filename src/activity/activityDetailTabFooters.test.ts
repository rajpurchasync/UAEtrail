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

  it('uses invite on Crew tab for open join before crew membership', () => {
    expect(resolveActivityDetailTabFooterKind({ ...base, tab: 'crew' })).toBe('crew_invite');
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

  it('host share on Crew tab', () => {
    expect(
      resolveActivityDetailTabFooterKind({
        ...base,
        tab: 'crew',
        isHostUser: true,
      })
    ).toBe('plan_host_share');
  });

  it('transport empty when no linked ride', () => {
    expect(
      resolveActivityDetailTabFooterKind({
        ...base,
        tab: 'transport',
        linkedRideshareId: null,
        rideshareEnabled: false,
      })
    ).toBe('transport_empty');
  });

  it('keeps plan join on every tab while request is pending', () => {
    const pending: JoinRequestUiState = {
      kind: 'pending',
      requestId: 'r1',
      status: 'pending',
    };
    expect(
      resolveActivityDetailTabFooterKind({ ...base, tab: 'transport', joinUiState: pending })
    ).toBe('plan_join');
    expect(
      resolveActivityDetailTabFooterKind({ ...base, tab: 'crew', joinUiState: pending })
    ).toBe('plan_join');
  });

  it('keeps plan join on every tab after host approval', () => {
    const confirmed: JoinRequestUiState = {
      kind: 'confirmed',
      requestId: 'r1',
    };
    expect(
      resolveActivityDetailTabFooterKind({ ...base, tab: 'transport', joinUiState: confirmed })
    ).toBe('plan_join');
  });
});
