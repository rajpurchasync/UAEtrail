import { describe, expect, it } from 'vitest';
import {
  isOutingCrewGroupRow,
  memberGroupInboundTypeFromKind,
  memberGroupKindFromInboundType,
  resolveMemberGroupShape,
  teamAllowsKidRoster,
} from './member-group.js';

describe('member-group model', () => {
  it('maps legacy activity type to outing_crew', () => {
    expect(memberGroupKindFromInboundType('activity')).toBe('outing_crew');
    expect(memberGroupKindFromInboundType('outing_crew')).toBe('outing_crew');
    expect(memberGroupKindFromInboundType('colleagues')).toBe('team');
  });

  it('resolves kind and teamLabel from stored row', () => {
    expect(
      resolveMemberGroupShape({ type: 'family', kind: 'team', teamLabel: 'family' })
    ).toMatchObject({ kind: 'team', teamLabel: 'family', inboundType: 'family' });
    expect(resolveMemberGroupShape({ type: 'activity' })).toMatchObject({
      kind: 'outing_crew',
      teamLabel: null,
      inboundType: 'outing_crew',
    });
    expect(resolveMemberGroupShape({ type: 'friends', kind: 'activity_crew' })).toMatchObject({
      kind: 'outing_crew',
      teamLabel: null,
    });
  });

  it('kid roster only on family-labelled teams', () => {
    expect(teamAllowsKidRoster({ kind: 'team', teamLabel: 'family' })).toBe(true);
    expect(teamAllowsKidRoster({ kind: 'team', teamLabel: 'colleagues' })).toBe(false);
    expect(teamAllowsKidRoster({ kind: 'outing_crew', teamLabel: null })).toBe(false);
  });

  it('round-trips legacy type for API compat', () => {
    expect(memberGroupInboundTypeFromKind('team', 'friends')).toBe('friends');
    expect(memberGroupInboundTypeFromKind('outing_crew', null)).toBe('outing_crew');
  });

  it('detects outing crew rows from kind or legacy type', () => {
    expect(isOutingCrewGroupRow({ kind: 'outing_crew', type: 'outing_crew' })).toBe(true);
    expect(isOutingCrewGroupRow({ type: 'activity' })).toBe(true);
    expect(isOutingCrewGroupRow({ kind: 'team', type: 'friends' })).toBe(false);
  });
});