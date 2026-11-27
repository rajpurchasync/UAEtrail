import { describe, expect, it } from 'vitest';
import { ACTIVITY_STATUS_JOIN_REQUESTED } from '../content/activityParticipationCopy';
import { resolveActivityDetailHeroStatusChips } from './activityDetailHeroStatus';

describe('resolveActivityDetailHeroStatusChips', () => {
  it('shows joined and spots for confirmed participant', () => {
    const chips = resolveActivityDetailHeroStatusChips({
      joinUiState: { kind: 'confirmed', requestId: 'r1' },
      slotsAvailable: 3,
      slotsTotal: 10,
      previewMode: false,
      isHostUser: false,
    });
    expect(chips.map((c) => c.label)).toEqual(['Joined']);
  });

  it('returns empty for preview', () => {
    expect(
      resolveActivityDetailHeroStatusChips({
        joinUiState: { kind: 'open' },
        slotsAvailable: 1,
        slotsTotal: 5,
        previewMode: true,
        isHostUser: false,
      })
    ).toEqual([]);
  });

  it('shows join requested for pending participant', () => {
    const chips = resolveActivityDetailHeroStatusChips({
      joinUiState: { kind: 'pending', requestId: 'r1', status: 'pending' },
      slotsAvailable: 2,
      slotsTotal: 8,
      previewMode: false,
      isHostUser: false,
    });
    expect(chips[0]).toEqual({ label: ACTIVITY_STATUS_JOIN_REQUESTED, tone: 'warning' });
  });

  it('shows host capacity and invited chips', () => {
    const chips = resolveActivityDetailHeroStatusChips({
      joinUiState: { kind: 'open' },
      slotsAvailable: 5,
      slotsTotal: 5,
      previewMode: false,
      isHostUser: true,
      confirmedParticipantCount: 0,
      pendingJoinInviteCount: 2,
    });
    expect(chips.map((c) => c.label)).toEqual(['0/5 going', '2 invited']);
  });
});
