import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const vitestPathsInScript = (rel: string) => {
  const matches = read(rel).matchAll(/(?:src|packages)\/[^\s'"`]+\.test\.(?:ts|tsx)/g);
  return [...new Set([...matches].map((m) => m[0]))];
};

const domainFeVitest = () => vitestPathsInScript('scripts/verify-domain-fe.mjs');

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

  it('GW2b-03: deprecated FE re-export shim files removed', () => {
    expect(existsSync(join(ROOT, 'src/utils/activityPublicSeo.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/components/mobile/ConsumerDetailHeaderChromeTitle.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/place/detail/resolvePlaceConsumerDetailHeaderChrome.ts'))).toBe(false);
    const tree = [read('src/pages/ActivityDetail.tsx'), read('src/pages/PlaceDetailPage.tsx')].join('\n');
    expect(tree).not.toMatch(/activityPublicSeo/);
    expect(tree).not.toMatch(/resolvePlaceConsumerDetailHeaderChrome/);
    expect(tree).not.toMatch(/ConsumerDetailHeaderChromeTitle/);
  });

  it('GW3-01: DMCP spine runners do not re-list verify:domain:fe vitest files', () => {
    const domain = new Set(domainFeVitest());
    const spines = [
      'scripts/verify-compose-spine.mjs',
      'scripts/verify-participation-spine.mjs',
      'scripts/verify-storefront-spine.mjs',
      'scripts/verify-people-graph-plan.mjs',
      'scripts/verify-release-ops.mjs',
    ];
    for (const spine of spines) {
      const overlap = vitestPathsInScript(spine).filter((p) => domain.has(p));
      expect(overlap, `${spine}`).toEqual([]);
    }
  });

  it('GW3-02: verify:system runs domain before spine orchestrators', () => {
    const order = read('scripts/verify-system-coherence.mjs');
    const domainAt = order.indexOf("npm run verify:domain");
    const composeAt = order.indexOf("npm run verify:compose-spine");
    expect(domainAt).toBeGreaterThan(-1);
    expect(composeAt).toBeGreaterThan(domainAt);
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