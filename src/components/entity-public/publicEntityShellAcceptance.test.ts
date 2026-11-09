import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) => readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('public entity shell (S9 Phase 5)', () => {
  it('shop public page uses DetailPageShell and shop tab wire ids', () => {
    const shop = read('src/components/shop/ShopPublicPage.tsx');
    expect(shop).toMatch(/DetailPageShell/);
    expect(shop).toMatch(/shopPublicDetailTab/);
    expect(shop).toMatch(/ConsumerDetailSectionJumpNav/);
  });

  it('organisation public route uses EntityPublicDetailShell and tab layout', () => {
    const page = read('src/pages/OrganisationProfile.tsx');
    expect(page).toMatch(/EntityPublicDetailShell/);
    expect(page).toMatch(/entityTabLayout/);
    expect(page).not.toMatch(/ConsumerShell/);
  });
});
