import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('data export contract', () => {
  it('includes engagement slices in member export', () => {
    const source = readFileSync(join(process.cwd(), 'src/services/data-export.ts'), 'utf8');
    expect(source).toMatch(/wishlist:/);
    expect(source).toMatch(/entityFollows:/);
    expect(source).toMatch(/memberGoals:/);
    expect(source).toMatch(/memberFollowing:/);
    expect(source).toMatch(/badges:/);
    expect(source).toMatch(/mapPins:/);
    expect(source).toMatch(/listUserWishlistItems/);
    expect(source).toMatch(/listEntityFollowsWithDetails/);
    expect(source).toMatch(/listMemberGoals/);
    expect(source).toMatch(/listFollowingForUser/);
    expect(source).toMatch(/findUserBadges/);
    expect(source).toMatch(/listMemberMapPinsForUser/);
  });
});
