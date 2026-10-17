import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  hostBrandProfilePath,
  parseEntityRefFromPathname,
  publishesActivityAsIndividual,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';

const ROOT = join(process.cwd(), '..', '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** MIG-COH-07 — individuals are `/member/:userId`; `/guide` is not a public surface. */
describe('publisher canonical guard (COH-07)', () => {
  it('individual Pro resolves to member, never /guide', () => {
    expect(publishesActivityAsIndividual('community')).toBe(true);
    expect(publishesActivityAsIndividual('pro_guide')).toBe(true);
    expect(publishesActivityAsIndividual('agency')).toBe(false);
    expect(hostBrandProfilePath('omar-guides', 'pro_guide')).toBeNull();
    expect(parseEntityRefFromPathname('/guide/omar-guides')).toBeNull();
    expect(parseEntityRefFromPathname('/operator/overview')).toBeNull();
    expect(
      resolveActivityPublisherProfilePath({
        publishingProfileKind: 'pro_guide',
        tenantSlug: 'omar-guides',
        hostUserId: 'u-omar',
      })
    ).toBe('/member/u-omar');
  });

  it('SPA does not register /guide', () => {
    const app = read('src/App.tsx');
    expect(app).not.toMatch(/path="\/guide\//);
    expect(app).not.toMatch(/LegacyOperatorProfileRedirect/);
    expect(app).toMatch(/OperatorPublishingAlias/);
  });

  it('does not emit /guide/ person storefronts from publisher helpers', () => {
    const entityPath = read('packages/shared-types/src/entity-path.ts');
    expect(entityPath).not.toMatch(/GUIDE_PROFILE_PATH_PREFIX/);
    expect(entityPath).not.toMatch(/export const guideProfilePath/);
    expect(entityPath).not.toMatch(/LEGACY_OPERATOR_PATH_RE/);
    const preview = read('apps/api/src/lib/area-pro-host-preview.ts');
    expect(preview).not.toMatch(/\/guide\//);
    const share = read('src/utils/profileShare.ts');
    expect(share).not.toMatch(/guideProfilePath/);
  });
});
