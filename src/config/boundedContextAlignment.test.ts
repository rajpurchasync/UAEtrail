import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const manifest = JSON.parse(
  readFileSync(join(ROOT, 'scripts/bounded-context-manifest.json'), 'utf8')
) as {
  contexts: Array<{
    id: string;
    label: string;
    apiFiles: string[];
    routeRegistrars: string[];
    feDomains: string[];
    feRoots: string[];
  }>;
  feDomainModules: string[];
  removedProducts: Record<string, { bannedRouteFiles?: string[]; bannedFeDomains?: string[] }>;
};

const exists = (rel: string) => existsSync(join(ROOT, rel));

describe('boundedContextAlignment (frontend + manifest)', () => {
  it('every bounded context has at least one FE domain module and UI root on disk', () => {
    const violations: string[] = [];
    for (const ctx of manifest.contexts) {
      for (const domain of ctx.feDomains) {
        if (!exists(domain)) violations.push(`${ctx.id}: missing ${domain}`);
      }
      if (ctx.feRoots.length > 0 && !ctx.feRoots.some((r) => exists(r))) {
        violations.push(`${ctx.id}: no feRoots found (${ctx.feRoots.join(', ')})`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('domains/index.ts exports every feDomainModules entry', () => {
    const index = readFileSync(join(ROOT, 'src/api/domains/index.ts'), 'utf8');
    const exportNeedle: Record<string, string> = {
      placeRegistry: 'fetchPlaceRegistry',
      places: 'placeApi',
    };
    const missing = manifest.feDomainModules.filter((name) => {
      const needle = exportNeedle[name] ?? `${name}Api`;
      return !index.includes(needle);
    });
    expect(missing).toEqual([]);
  });

  it('removed product modules stay deleted', () => {
    const violations: string[] = [];
    for (const product of Object.values(manifest.removedProducts)) {
      for (const file of product.bannedFeDomains ?? []) {
        if (exists(file)) violations.push(`removed FE: ${file}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
