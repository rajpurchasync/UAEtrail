import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('operatorDeskProjectionGuard', () => {
  it('PROJ-01: HostingHubView quick links come from desk module registry', () => {
    const hub = read('src/hosting/HostingHubView.tsx');
    expect(hub).toMatch(/operatorDeskQuickLinksForKind/);
    expect(hub).not.toMatch(/OPERATOR_TEAM_PATH/);
    expect(hub).not.toMatch(/OPERATOR_PLACES_PATH/);
  });

  it('PROJ-02: operator overview uses HostingHubView for all publishing kinds when tenant is active', () => {
    const overview = read('src/operator/desk/Overview.tsx');
    expect(overview).toContain('HostingHubView');
    expect(overview).not.toMatch(/isCommunityTenant/);
  });

  it('PROJ-03: shop desk storefront uses publishing workspace client', () => {
    const panel = read('src/operator/desk/ShopDeskProfilePanel.tsx');
    expect(panel).toMatch(/operatorShopStorefrontClientApi/);
    expect(panel).not.toMatch(/shopMerchantClientApi/);
    expect(read('src/api/domains/publishingWorkspace.ts')).toMatch(/\/publishing\/shop-profile/);
  });

  it('PROJ-04: mobile operator drawer uses kind-aware desk nav (not static link list)', () => {
    const menu = read('src/components/layout/MobileMenu.tsx');
    expect(menu).toMatch(/operatorDeskNavLinksForKind/);
    expect(menu).not.toMatch(/OPERATOR_CONSOLE_LINKS/);
    expect(read('src/constants/index.ts')).not.toMatch(/OPERATOR_CONSOLE_LINKS/);
  });

  it('PROJ-05: profile publishing chips open operator overview with tenant primed', () => {
    const section = read('src/components/profile/ProfileMapPresenceSection.tsx');
    expect(section).toMatch(/operatorDeskOverviewPath/);
    expect(section).toMatch(/primeOperatorDeskTenant/);
    expect(section).not.toMatch(/operatorDeskProfilePath/);
  });
});