import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('governanceSurfaceGuard (GW-1 — no duplicate schedules)', () => {
  it('GW1-01: no Cursor agent plan markdown (schedule is manifest + touchpoints)', () => {
    const plansDir = join(ROOT, '.cursor/plans');
    if (!existsSync(plansDir)) return;
    const plans = readdirSync(plansDir).filter((f) => f.endsWith('.plan.md'));
    expect(plans, `remove: ${plans.join(', ')}`).toEqual([]);
  });

  it('GW1-02: people-vocabulary touchpoints omit planFile pointer', () => {
    const raw = read('scripts/people-vocabulary-touchpoints.json');
    expect(raw).not.toMatch(/"planFile"/);
    expect(raw).not.toMatch(/\.cursor\/plans\//);
  });

  it('GW1-03: no program-normalize-archive shim (use compact-platform-program)', () => {
    expect(existsSync(join(ROOT, 'scripts/program-normalize-archive.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/normalize-refactor-program-archive.mjs'))).toBe(false);
    expect(read('package.json')).not.toMatch(/program:normalize-archive/);
  });

  it('GW2-02: no dual Find crew HTTP path (/me/member-discovery/roster)', () => {
    const routes = read('apps/api/src/routes/user/registerMemberDiscoveryRoutes.ts');
    expect(routes).not.toMatch(/\/me\/member-discovery\/roster/);
    expect(routes).not.toMatch(/Deprecation/);
    expect(read('apps/api/src/routes/user/registerDiscoverCrewRoutes.ts')).toMatch(/\/discover\/crew/);
  });

  it('GW2-01: matching notify re-export shims removed (GW-2)', () => {
    expect(existsSync(join(ROOT, 'apps/api/src/services/wishlist-alerts.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'apps/api/src/services/availability-hosted-match-notifications.ts'))).toBe(
      false
    );
    const manifest = JSON.parse(read('scripts/bounded-context-manifest.json')) as {
      contexts: { id: string; apiFiles?: string[] }[];
    };
    const matching = manifest.contexts.find((c) => c.id === 'matching');
    expect(matching?.apiFiles ?? []).not.toContain('apps/api/src/services/wishlist-alerts.ts');
  });

  it('GW1-04: platform-program has archivePolicy; no MIG-PROGRAM-ARCHIVE row', () => {
    const program = JSON.parse(read('scripts/platform-program.json')) as {
      archivePolicy?: string;
      migrations?: { id: string }[];
    };
    expect(program.archivePolicy).toMatch(/scheduleDoc/);
    expect(program.migrations?.some((m) => m.id === 'MIG-PROGRAM-ARCHIVE')).toBe(false);
  });
});