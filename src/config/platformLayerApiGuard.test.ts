import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLATFORM_LAYER_API_MODULES } from '../../packages/shared-types/src/platform-layer-api.js';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * MIG-PLATFORM-LAYER-SPINE PLS-1 — FE domain modules stay on layer rails.
 */
describe('platformLayerApiGuard (PLS-1)', () => {
  it('LAYER-04: bounded manifest roots availability publish + matching ops', () => {
    const manifest = JSON.parse(read('scripts/governance/bounded-context-manifest.json')) as {
      contexts: { id: string; feRoots?: string[]; apiFiles?: string[] }[];
    };
    const availability = manifest.contexts.find((c) => c.id === 'availability');
    expect(availability?.feRoots).toContain('src/availability');
    const matching = manifest.contexts.find((c) => c.id === 'matching');
    expect(matching?.apiFiles).toContain('apps/api/src/services/matching/index.ts');
    const engagement = manifest.contexts.find((c) => c.id === 'engagement');
    expect(engagement?.apiFiles ?? []).not.toContain('apps/api/src/services/wishlist-alerts.ts');
  });

  it('LAYER-05: connect hub does not import discover crew panel', () => {
    const myCrews = read('src/pages/MyCrews.tsx');
    expect(myCrews).not.toMatch(/crew-discovery\/panel/);
    expect(myCrews).not.toMatch(/CrewBrowseTabContent/);
  });

  it('LAYER-08: plan/wishlist domain modules listed on plan layer', () => {
    expect(PLATFORM_LAYER_API_MODULES.plan).toEqual(
      expect.arrayContaining(['wishlist', 'goals', 'availability'])
    );
    expect(PLATFORM_LAYER_API_MODULES.join).toEqual(expect.arrayContaining(['activities']));
    const wishlistDomain = read('src/api/domains/wishlist.ts');
    expect(wishlistDomain).toMatch(/\/me\/wishlist/);
    expect(read('packages/shared-types/src/platform-layer-api.ts')).toMatch(/PLATFORM_LAYER_API_MODULES/);
  });
});