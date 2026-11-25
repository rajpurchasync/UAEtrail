import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const collectProductionSources = (): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === 'node_modules') continue;
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry) || entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) continue;
      files.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  };
  walk(join(ROOT, 'src'));
  return files;
};

const SHIM_ALLOWLIST = new Set([
  'src/hooks/areaHubClientApi.ts',
  'src/pages/AreaDetailPage.tsx',
  'src/config/destinationFeWireGuard.test.ts',
]);

/** MIG-DESTINATION-GEO Phase D — hub client + detail route naming. */
describe('destinationFeWireGuard', () => {
  it('production imports destinationHubClientApi, not areaHubClientApi', () => {
    const pattern = /from\s+['"][^'"]*areaHubClientApi['"]/;
    const violations: string[] = [];
    for (const file of collectProductionSources()) {
      if (SHIM_ALLOWLIST.has(file)) continue;
      if (pattern.test(read(file))) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('hub detail route module is DestinationDetailPage', () => {
    expect(read('src/pages/DestinationDetailPage.tsx')).toMatch(/destinationHubClientApi/);
    expect(read('src/routing/appLazyPages.tsx')).toMatch(/DestinationDetailPage/);
    expect(read('src/routing/AppRoutes.tsx')).toMatch(/DestinationDetailPage/);
  });
});