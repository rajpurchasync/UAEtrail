import { describe, expect, it } from 'vitest';
import {
  canViewMemberPublicCardFields,
  canViewMemberTrustedProfileFields,
} from './memberProfileFieldAccess';

describe('memberProfileFieldAccess', () => {
  it('public exposure opens the member card without trusted fields', () => {
    expect(
      canViewMemberPublicCardFields({
        exposure: 'public',
        canViewFullProfile: false,
        canOpenMemberProfile: true,
        level: 'public',
        gateReason: null,
      })
    ).toBe(true);
    expect(
      canViewMemberTrustedProfileFields({
        canViewFullProfile: false,
      })
    ).toBe(false);
  });

  it('full exposure enables trusted fields', () => {
    expect(
      canViewMemberPublicCardFields({
        exposure: 'full',
        canViewFullProfile: true,
        canOpenMemberProfile: true,
        level: 'accepted_friend',
        gateReason: null,
      })
    ).toBe(true);
    expect(canViewMemberTrustedProfileFields({ canViewFullProfile: true })).toBe(true);
  });
});
