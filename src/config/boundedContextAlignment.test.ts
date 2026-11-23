import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const manifest = JSON.parse(
  readFileSync(join(ROOT, 'scripts/governance/bounded-context-manifest.json'), 'utf8')
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
  removedProducts: Record<
    string,
    { bannedRouteFiles?: string[]; bannedFeDomains?: string[]; bannedFePages?: string[] }
  >;
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
      placeCatalogClient: 'fetchPlaceCatalog',
      places: 'placeApi',
      facilities: 'facilityApi',
      memberCommitmentHub: 'memberCommitmentHubApi',
    };
    const missing = manifest.feDomainModules.filter((name) => {
      const needle = exportNeedle[name] ?? `${name}Api`;
      return !index.includes(needle);
    });
    expect(missing).toEqual([]);
  });

  it('every src/api/domains module is owned by a bounded context', () => {
    const assigned = new Set<string>();
    for (const ctx of manifest.contexts) {
      for (const domain of ctx.feDomains) {
        assigned.add(domain.replace(/\\/g, '/'));
      }
    }
    const shims = new Set<string>();
    const domainDir = join(ROOT, 'src/api/domains');
    const orphans: string[] = [];
    for (const name of readdirSync(domainDir)) {
      if (!name.endsWith('.ts') || name.endsWith('.test.ts') || name === 'index.ts') continue;
      const rel = `src/api/domains/${name}`;
      if (shims.has(rel)) continue;
      if (!assigned.has(rel)) orphans.push(rel);
    }
    expect(orphans).toEqual([]);
  });

  it('removed product modules stay deleted', () => {
    const violations: string[] = [];
    for (const product of Object.values(manifest.removedProducts)) {
      for (const file of product.bannedRouteFiles ?? []) {
        if (exists(file)) violations.push(`removed API route: ${file}`);
      }
      for (const file of product.bannedFeDomains ?? []) {
        if (exists(file)) violations.push(`removed FE: ${file}`);
      }
      for (const file of product.bannedFePages ?? []) {
        if (exists(file)) violations.push(`removed FE page: ${file}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
