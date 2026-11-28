import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('operatorStorefrontSpineGuard (DMCP Phase 6)', () => {
  it('STOREFRONT-SPINE-01: PublishingProfileKind resolves in shared-types only', () => {
    expect(read('packages/shared-types/src/publishing-profile-kind.ts')).toMatch(
      /export const resolvePublishingProfileKind/
    );
    expect(read('packages/shared-types/src/explore-presentation.ts')).toMatch(/PublishingProfileKind/);
    expect(read('apps/api/src/services/member-status.ts')).toMatch(/resolvePublishingProfileKind/);
  });

  it('STOREFRONT-SPINE-02: Pro funnel uses PRO_MEMBERSHIP_PATH (become-host inbound only)', () => {
    expect(read('src/config/memberRoutes.ts')).toMatch(/PRO_MEMBERSHIP_PATH/);
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/profile\/pro-membership/);
    expect(read('scripts/governance/authority-matrix.json')).toMatch(/consumer-become-host/);
    expect(read('src/member/hostMemberGuard.test.ts')).toMatch(/become-host/);
  });

  it('STOREFRONT-SPINE-03: operator desk SPA /operator/*; HTTP /publishing', () => {
    expect(read('src/config/publishingConsoleRoutingGuard.test.ts')).toMatch(/\/publishing/);
    expect(read('src/member/publishingConsoleHookGuard.test.ts')).toMatch(/tenantActivityClientApi/);
    expect(read('src/member/organisationNamingGuard.test.ts')).toMatch(/TenantStorefrontPage/);
  });

  it('STOREFRONT-SPINE-04: shop and agency public detail use client facades', () => {
    expect(read('src/config/detailSurfaceDataLineageGuard.test.ts')).toMatch(/shopPublicClientApi/);
    expect(read('src/config/detailSurfaceDataLineageGuard.test.ts')).toMatch(/operatorDeskClientApi/);
    const matrix = JSON.parse(read('scripts/governance/authority-matrix.json'));
    const byId = new Map((matrix.actions ?? []).map((a: { id: string }) => [a.id, a]));
    expect(byId.get('shop.public_profile')?.axis).toBe('C_STOREFRONT');
    expect(byId.get('publish.as_tenant')?.resolver?.module).toMatch(/publishing-profile-kind/);
    expect(byId.get('publish.shop_storefront')?.contextId).toBe('publishing_workspace');
    expect(byId.get('publish.shop_storefront')?.http?.path).toBe('/publishing/shop-profile');
  });

  it('STOREFRONT-SPINE-05: workspace access does not broaden via UserRole', () => {
    expect(read('apps/api/src/services/member-publishing-workspace-access.ts')).toMatch(
      /resolvePublishingWorkspaceAccess/
    );
    expect(read('apps/api/src/services/member-publishing-workspace-access.ts')).not.toMatch(/\bisHostRole\b/);
  });

  it('STOREFRONT-SPINE-06: verify:storefront-spine wired (DMCP Phase 6)', () => {
    expect(read('package.json')).toMatch(/verify:storefront-spine/);
    expect(existsSync(join(process.cwd(), 'scripts/verify/verify-storefront-spine.mjs'))).toBe(true);
    const matrix = JSON.parse(read('scripts/governance/authority-matrix.json'));
    expect(matrix.dmcpPhase).toBeGreaterThanOrEqual(6);
  });
});