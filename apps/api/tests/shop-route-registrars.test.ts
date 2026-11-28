import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('shop route registrars (COH-11)', () => {
  it('shop.ts is a thin public mount shell', () => {
    const shop = read('src/routes/shop.ts');
    expect(shop).toMatch(/registerShopPublicRoutes/);
    expect(shop).not.toMatch(/registerShopMerchantManageRoutes/);
    expect(shop).not.toMatch(/registerShopCheckoutRoutes/);
    expect(shop).not.toMatch(/shopRouter\.(get|post|patch|delete)\(/);
  });

  it('public storefront keeps /shops/:id with /merchants/:id alias', () => {
    const registrar = read('src/routes/shop/registerShopPublicRoutes.ts');
    expect(registrar).toMatch(/\/shops\/:id/);
    expect(registrar).toMatch(/\/merchants\/:id/);
    expect(registrar).toMatch(/shop-public-read/);
    expect(registrar).not.toMatch(/\/products/);
  });

  it('shop operator manage lives on publishing workspace', () => {
    const publishing = read('src/routes/workspace.ts');
    expect(publishing).toMatch(/registerPublishingShopStorefrontRoutes/);
    const registrar = read('src/routes/publishing/registerPublishingShopStorefrontRoutes.ts');
    expect(registrar).toMatch(/\/shop-profile/);
    expect(registrar).toMatch(/shop-merchant-commands/);
    expect(registrar).toMatch(/assertPublishingShopTenant/);
  });

  it('FE desk uses operatorWorkspace for shop profile manage', () => {
    const workspace = read('../../src/api/domains/operatorWorkspace.ts');
    expect(workspace).toMatch(/\/workspace\/shop-profile/);
    expect(workspace).not.toMatch(/\/shop\/merchant\//);
    const shop = read('../../src/api/domains/shop.ts');
    expect(shop).not.toMatch(/\/shop\/merchant\//);
    const panel = read('../../src/operator/desk/ShopDeskProfilePanel.tsx');
    expect(panel).toMatch(/operatorShopStorefrontClientApi/);
  });

  it('retired /shop/merchant manage registrar is removed', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/shop/registerShopMerchantManageRoutes.ts'))).toBe(
      false
    );
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
    expect(shared).toMatch(/ShopOperatorProfileDTO/);
  });
});