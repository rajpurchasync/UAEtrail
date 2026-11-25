import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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

/** MIG-DESTINATION-GEO Phase F — FE destination geo shims removed. */
describe('destinationFeWireGuard', () => {
  it('retired shim modules stay deleted', () => {
    expect(existsSync(join(ROOT, 'src/hooks/areaHubClientApi.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/pages/AreaDetailPage.tsx'))).toBe(false);
    expect(read('src/routing/appLazyPages.tsx')).not.toMatch(/export const AreaDetailPage/);
  });

  it('production imports destinationHubClientApi, not areaHubClientApi', () => {
    const pattern = /from\s+['"][^'"]*areaHubClientApi['"]/;
    const violations: string[] = [];
    for (const file of collectProductionSources()) {
      if (file === 'src/config/destinationFeWireGuard.test.ts') continue;
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