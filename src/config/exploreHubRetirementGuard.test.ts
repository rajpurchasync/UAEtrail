import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const collectTsUnder = (dir: string): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...collectTsUnder(full));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      out.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return out;
};

/** Retired `/explore/hub` product — no routes, compat params, or session keys. */
describe('exploreHubRetirementGuard', () => {
  it('HUB-RET-01: src/explore/hub directory removed', () => {
    expect(existsSync(join(ROOT, 'src/explore/hub'))).toBe(false);
  });

  it('HUB-RET-02: explore/search sources drop ExploreHub* symbols', () => {
    const violations: string[] = [];
    for (const file of collectTsUnder(join(ROOT, 'src/explore/search'))) {
      const content = readFileSync(join(ROOT, file), 'utf8');
      if (/ExploreHub|EXPLORE_HUB_/.test(content)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it('HUB-RET-03: no /explore/hub SPA redirect host', () => {
    expect(existsSync(join(ROOT, 'src/explore/search/ExploreInboundHubRedirect.tsx'))).toBe(false);
    const routing = readFileSync(join(ROOT, 'src/explore/search/exploreSearchRouting.ts'), 'utf8');
    expect(routing).not.toMatch(/exploreInboundHubRedirectTarget/);
    expect(routing).not.toMatch(/INBOUND_HUB_SCOPE_PARAM/);
  });

  it('HUB-RET-04: explore/search has no hub wire symbols', () => {
    const banned = /\/explore\/hub|uaetrail:hub\.|INBOUND_HUB_|ExploreInboundHub|hubMode/;
    const violations: string[] = [];
    for (const file of collectTsUnder(join(ROOT, 'src/explore/search'))) {
      const content = readFileSync(join(ROOT, file), 'utf8');
      if (banned.test(content)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });
});