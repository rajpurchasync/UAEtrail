import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('data export contract', () => {
  it('includes wishlist and entity follows in member export', () => {
    const source = readFileSync(join(process.cwd(), 'src/services/data-export.ts'), 'utf8');
    expect(source).toMatch(/wishlist:/);
    expect(source).toMatch(/entityFollows:/);
    expect(source).toMatch(/listUserWishlistItems/);
    expect(source).toMatch(/listEntityFollowsWithDetails/);
  });
});
