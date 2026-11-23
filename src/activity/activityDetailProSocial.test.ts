import { describe, expect, it } from 'vitest';
import {
  activityDetailShowHostProfileProUpsell,
  activityDetailShowRosterProUpsell,
} from './activityDetailProSocial';

describe('activityDetailProSocial', () => {
  it('shows host profile Pro upsell when entitlements block pre-join profile', () => {
    expect(
      activityDetailShowHostProfileProUpsell(
        { canViewHostProfileBeforeJoin: false } as never,
        true,
        false,
        false
      )
    ).toBe(true);
    expect(
      activityDetailShowHostProfileProUpsell(
        { canViewHostProfileBeforeJoin: true } as never,
        true,
        false,
        false
      )
    ).toBe(false);
  });

  it('shows roster Pro upsell when buddies-only mask hides participants', () => {
    expect(
      activityDetailShowRosterProUpsell(
        { canViewFullFriendRoster: false } as never,
        true,
        5,
        2
      )
    ).toBe(true);
    expect(
      activityDetailShowRosterProUpsell(
        { canViewFullFriendRoster: true } as never,
        true,
        5,
        2
      )
    ).toBe(false);
  });
});
