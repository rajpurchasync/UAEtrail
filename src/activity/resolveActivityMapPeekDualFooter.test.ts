import { describe, expect, it } from 'vitest';
import { resolveActivityDetailStandardFooter } from '../components/activity/detail/activityDetailFooterSlots';
import { resolveActivityMapPeekDualFooter } from './resolveActivityMapPeekDualFooter';

describe('resolveActivityMapPeekDualFooter', () => {
  it('maps open guest to join primary + message host icon', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: false,
      joinUiState: { kind: 'open' },
      joinLabel: "I'm going",
    });
    const dual = resolveActivityMapPeekDualFooter(footer);
    expect(dual.primary.action).toBe('request_join');
    expect(dual.iconButton?.action).toBe('message_host');
    expect(dual.extraButtons).toEqual([]);
  });

  it('maps host to manage primary + share icon', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: true,
      joinUiState: { kind: 'open' },
      joinLabel: 'Join',
    });
    const dual = resolveActivityMapPeekDualFooter(footer);
    expect(dual.primary.action).toBe('host_manage');
    expect(dual.iconButton?.action).toBe('share_activity');
  });

  it('puts withdraw on extra row when joined with participation manage', () => {
    const footer = resolveActivityDetailStandardFooter({
      isHost: false,
      joinUiState: { kind: 'confirmed', requestId: 'r1' },
      joinLabel: 'Join',
      canManageParticipation: true,
    });
    const dual = resolveActivityMapPeekDualFooter(footer);
    expect(dual.primary.action).toBe('open_crew_chat');
    expect(dual.iconButton?.action).toBe('participant_invite');
    expect(dual.extraButtons.map((b) => b.action)).toEqual(['participant_withdraw']);
  });
});