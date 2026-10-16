import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const collectTs = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue;
      collectTs(full, out);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      out.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

/** Shims allowed until CPC-7 allowlist shrink. */
const PLACE_CATALOG_API_SHIM = 'src/hooks/placeCatalogApi.ts';
const PLACE_REGISTRY_SHIM = 'src/api/domains/placeRegistry.ts';

describe('CPC terminology guard (FE)', () => {
  it('canonical catalog submit imports use memberCatalogSubmitClientApi or placeCatalogReadsClientApi', () => {
    const mustUseCanonical = [
      'src/explore/ui/contributeFlow.ts',
      'src/explore/ui/contributeFacilityFlow.ts',
      'src/services/catalogPlaceSubmit.ts',
      'src/services/catalogFacilitySubmit.ts',
      'src/services/organizeActivityPublish.ts',
      'src/components/ui/SubmitPlaceForm.tsx',
      'src/components/ui/PlaceSelect.tsx',
      'src/pages/Contributions.tsx',
    ];
    const violations: string[] = [];
    for (const file of mustUseCanonical) {
      const content = read(file);
      if (/from ['"].*placeCatalogApi/.test(content)) {
        violations.push(
          `${file}: import placeCatalogApi shim — use memberCatalogSubmitClientApi / placeCatalogReadsClientApi`
        );
      }
      if (/submitUserLocation/.test(content)) {
        violations.push(`${file}: submitUserLocation — use submitMemberPlace`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not add new imports of placeCatalogApi outside the shim', () => {
    const files = collectTs(join(ROOT, 'src')).filter(
      (f) => !f.endsWith('.test.ts') && f !== PLACE_CATALOG_API_SHIM
    );
    const violations: string[] = [];
    for (const file of files) {
      const content = read(file);
      if (/from ['"].*\/placeCatalogApi['"]/.test(content)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not introduce submitUserLocation outside legacy API shims', () => {
    const allow = new Set([
      'src/api/domains/places.ts',
      'src/api/services.ts',
      'src/api/apiLegacyGuard.test.ts',
      'src/hooks/memberCatalogSubmitClientApi.ts',
      'src/hooks/placeCatalogApi.ts',
    ]);
    const violations: string[] = [];
    for (const file of collectTs(join(ROOT, 'src')).filter(
      (f) => !f.endsWith('.test.ts') && !allow.has(f)
    )) {
      if (/submitUserLocation/.test(read(file))) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('SYSTEM_COHERENCE documents CPC implementation map §8.4.9', () => {
    const doc = read('docs/SYSTEM_COHERENCE.md');
    expect(doc).toMatch(/#### 8\.4\.9/);
    expect(doc).toMatch(/memberCatalogSubmitClientApi/);
  });

  it('SYSTEM_COHERENCE documents HTTP surface-first catalog model §5.1', () => {
    const doc = read('docs/SYSTEM_COHERENCE.md');
    expect(doc).toMatch(/### 5\.1 HTTP entrypoints/);
    expect(doc).toMatch(/registerPublicPlaceRoutes/);
    expect(doc).toMatch(/registerMeFacilityRoutes/);
    expect(doc).toMatch(/not profile-first/);
  });
});
