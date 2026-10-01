import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  isWomenOnlyActivityRequirements,
  resolveWomenOnlyJoinEligibility,
  womenOnlyJoinBlockMessage,
} from '@uaetrail/shared-types';

const mocks = vi.hoisted(() => ({
  findAuthUserById: vi.fn(),
}));

vi.mock('../src/lib/auth-users.js', () => ({
  findAuthUserById: mocks.findAuthUserById,
}));

import { assertParticipantMeetsWomenOnlyRequirement } from '../src/domain/activity-audience-requirements.js';

describe('activity audience requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects women-only requirement line', () => {
    expect(isWomenOnlyActivityRequirements(['Women only'])).toBe(true);
    expect(isWomenOnlyActivityRequirements(['Open RSVP'])).toBe(false);
  });

  it('resolves join eligibility from profile gender', () => {
    expect(resolveWomenOnlyJoinEligibility(['Women only'], 'female')).toBe('eligible');
    expect(resolveWomenOnlyJoinEligibility(['Women only'], 'male')).toBe('ineligible_gender');
    expect(resolveWomenOnlyJoinEligibility(['Women only'], 'prefer_not_to_say')).toBe(
      'profile_gender_required'
    );
    expect(resolveWomenOnlyJoinEligibility([], 'male')).toBe('eligible');
  });

  it('assertParticipantMeetsWomenOnlyRequirement blocks non-female members', async () => {
    mocks.findAuthUserById.mockResolvedValue({
      profile: { gender: 'male' },
    });

    await expect(
      assertParticipantMeetsWomenOnlyRequirement('user-1', ['Women only'])
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'women_only_restriction',
      message: womenOnlyJoinBlockMessage('ineligible_gender'),
    });
  });

  it('allows female members on women-only outings', async () => {
    mocks.findAuthUserById.mockResolvedValue({
      profile: { gender: 'female' },
    });

    await expect(
      assertParticipantMeetsWomenOnlyRequirement('user-1', ['Women only'])
    ).resolves.toBeUndefined();
  });
});
