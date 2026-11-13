import { describe, expect, it } from 'vitest';
import {
  memberProfileCanTogglePresentation,
  parseMemberProfileBrowseLens,
  presentationFromBrowseLens,
} from './memberProfilePresentation';

describe('memberProfilePresentation', () => {
  it('parses source query', () => {
    expect(parseMemberProfileBrowseLens('?source=host')).toBe('host');
    expect(parseMemberProfileBrowseLens('?source=friends')).toBe('friends');
  });

  it('defaults presentation from lens', () => {
    expect(presentationFromBrowseLens('host', false)).toBe('host');
    expect(presentationFromBrowseLens('friends', true)).toBe('social');
    expect(presentationFromBrowseLens('organic', true)).toBe('host');
  });

  it('toggle only when full access and host surfaces', () => {
    expect(
      memberProfileCanTogglePresentation({
        canViewFullProfile: true,
        isHost: true,
        activitiesHosted: 2,
      })
    ).toBe(true);
    expect(
      memberProfileCanTogglePresentation({
        canViewFullProfile: false,
        isHost: true,
        activitiesHosted: 2,
      })
    ).toBe(false);
  });
});
