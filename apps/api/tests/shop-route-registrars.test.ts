import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('shop route registrars (COH-11)', () => {
  it('shop.ts is a thin mount shell', () => {
    const shop = read('src/routes/shop.ts');
    expect(shop).toMatch(/registerShopPublicRoutes/);
    expect(shop).toMatch(/registerShopMerchantManageRoutes/);
    expect(shop).not.toMatch(/registerShopCheckoutRoutes/);
    expect(shop).not.toMatch(/shopRouter\.(get|post|patch|delete)\(/);
    expect(shop).not.toMatch(/merchantScopeSchema/);
  });

  it('public storefront keeps /shops/:id with /merchants/:id alias', () => {
    const registrar = read('src/routes/shop/registerShopPublicRoutes.ts');
    expect(registrar).toMatch(/\/shops\/:id/);
    expect(registrar).toMatch(/\/merchants\/:id/);
    expect(registrar).toMatch(/shop-public-read/);
    expect(registrar).not.toMatch(/\/products/);
  });

  it('merchant manage is profile-only (no product catalog routes)', () => {
    const registrar = read('src/routes/shop/registerShopMerchantManageRoutes.ts');
    expect(registrar).toMatch(/shopOrganisationManagePrefixes/);
    expect(registrar).toMatch(/shop-merchant-commands/);
    expect(registrar).not.toMatch(/\/merchant\/products/);
    expect(registrar).not.toMatch(/merchantScopeSchema/);
  });

  it('does not keep an empty socialGraphRouter shim', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/social/index.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/routes/social.ts'))).toBe(false);
  });

  it('shared-types wire has no product catalog DTOs', () => {
    const shared = read('../../packages/shared-types/src/index.ts');
    expect(shared).not.toMatch(/export interface ProductDTO/);
    expect(shared).not.toMatch(/TenantPublicProductDTO/);
    expect(shared).not.toMatch(/shopProducts\?/);
  });
});
