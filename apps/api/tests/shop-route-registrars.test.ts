import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('shop route registrars (COH-11)', () => {
  it('shop.ts is a thin mount shell', () => {
    const shop = read('src/routes/shop.ts');
    expect(shop).toMatch(/registerShopPublicRoutes/);
    expect(shop).toMatch(/registerShopCheckoutRoutes/);
    expect(shop).toMatch(/registerShopMerchantManageRoutes/);
    expect(shop).not.toMatch(/shopRouter\.(get|post|patch|delete)\(/);
    expect(shop).not.toMatch(/merchantScopeSchema/);
  });

  it('public storefront keeps /shops/:id with /merchants/:id alias', () => {
    const registrar = read('src/routes/shop/registerShopPublicRoutes.ts');
    expect(registrar).toMatch(/\/shops\/:id/);
    expect(registrar).toMatch(/\/merchants\/:id/);
    expect(registrar).toMatch(/shop-public-read/);
  });

  it('checkout lives in dedicated registrar', () => {
    const registrar = read('src/routes/shop/registerShopCheckoutRoutes.ts');
    expect(registrar).toMatch(/\/checkout\/config/);
    expect(registrar).toMatch(/shop-checkout-commands/);
    expect(registrar).not.toMatch(/listPublicProducts/);
  });

  it('merchant manage keeps live /organisation prefix (not a leftover file)', () => {
    const registrar = read('src/routes/shop/registerShopMerchantManageRoutes.ts');
    expect(registrar).toMatch(/shopOrganisationManagePrefixes/);
    expect(registrar).toMatch(/\/merchant\/products/);
    expect(registrar).toMatch(/shop-merchant-commands/);
    expect(registrar).not.toMatch(/merchantScopeSchema/);
  });

  it('does not keep an empty socialGraphRouter shim', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/social/index.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/routes/social.ts'))).toBe(false);
  });
});
