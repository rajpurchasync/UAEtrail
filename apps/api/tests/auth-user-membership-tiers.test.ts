import { describe, expect, it } from 'vitest';
import { MembershipTier } from '../src/domain/enums.js';
import { getAuthUserMembershipTiers } from '../src/lib/auth-users.js';

describe('getAuthUserMembershipTiers', () => {
  it('returns empty map for no ids', async () => {
    const map = await getAuthUserMembershipTiers([]);
    expect(map.size).toBe(0);
  });

  it('defaults missing users to FREE', async () => {
    const map = await getAuthUserMembershipTiers(['missing-user-id']);
    expect(map.get('missing-user-id')).toBe(MembershipTier.FREE);
  });
});
