import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const vitestPathsInScript = (rel: string) => {
  const matches = read(rel).matchAll(/(?:src|packages)\/[^\s'"`]+\.test\.(?:ts|tsx)/g);
  return [...new Set([...matches].map((m) => m[0]))];
};

const domainFeVitest = () => vitestPathsInScript('scripts/verify/verify-domain-fe.mjs');

describe('governanceSurfaceGuard (GW-1 — no duplicate schedules)', () => {
  it('GW1-01: no Cursor agent plan markdown (schedule is manifest + touchpoints)', () => {
    const plansDir = join(ROOT, '.cursor/plans');
    if (!existsSync(plansDir)) return;
    const plans = readdirSync(plansDir).filter((f) => f.endsWith('.plan.md'));
    expect(plans, `remove: ${plans.join(', ')}`).toEqual([]);
  });

  it('GW1-02: people-vocabulary touchpoints omit planFile pointer', () => {
    const raw = read('scripts/governance/people-vocabulary-touchpoints.json');
    expect(raw).not.toMatch(/"planFile"/);
    expect(raw).not.toMatch(/\.cursor\/plans\//);
  });

  it('GW1-03: no program-normalize-archive or compact-ledger shims', () => {
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
    const manifest = JSON.parse(read('scripts/governance/bounded-context-manifest.json')) as {
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
      'scripts/verify/verify-compose-spine.mjs',
      'scripts/verify/verify-participation-spine.mjs',
      'scripts/verify/verify-storefront-spine.mjs',
      'scripts/verify/verify-people-graph-plan.mjs',
      'scripts/verify/verify-release-ops.mjs',
    ];
    for (const spine of spines) {
      const overlap = vitestPathsInScript(spine).filter((p) => domain.has(p));
      expect(overlap, `${spine}`).toEqual([]);
    }
  });

  it('GW3-02: verify:system runs domain before spine orchestrators', () => {
    const order = read('scripts/verify/verify-system-coherence.mjs');
    const domainAt = order.indexOf("npm run verify:domain");
    const composeAt = order.indexOf("npm run verify:compose-spine");
    expect(domainAt).toBeGreaterThan(-1);
    expect(composeAt).toBeGreaterThan(domainAt);
  });

  it('GW1-04: platform-governance has archivePolicy; no MIG-PROGRAM-ARCHIVE row', () => {
    const governance = JSON.parse(read('scripts/governance/platform-governance.json')) as { archivePolicy?: string };
    const archive = JSON.parse(read('scripts/governance/platform-migration-archive.json')) as {
      migrations?: { id: string }[];
    };
    expect(governance.archivePolicy).toMatch(/touchpoint-registry/i);
    expect(archive.migrations?.some((m) => m.id === 'MIG-PROGRAM-ARCHIVE')).toBe(false);
  });

  it('GW4-01: retired platform-program.json (GW-4 split spine)', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/platform-governance.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-migration-archive.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-touchpoint-registry.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/platform-program.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/compact-platform-program.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/verify-platform-program.mjs'))).toBe(false);
  });

  it('GW5-01: scripts/ subdirs (governance, verify, lib, ops, dev, archive)', () => {
    for (const dir of ['governance', 'verify', 'lib', 'ops', 'dev', 'archive']) {
      expect(existsSync(join(ROOT, 'scripts', dir)), `missing scripts/${dir}`).toBe(true);
    }
    expect(existsSync(join(ROOT, 'scripts/README.md'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/bounded-context-manifest.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/verify/verify-system-coherence.mjs'))).toBe(true);
  });

  it('GW5-02: no verify runners or one-off shims at scripts/ root', () => {
    const rootScripts = existsSync(join(ROOT, 'scripts'))
      ? readdirSync(join(ROOT, 'scripts')).filter((f) => f.endsWith('.mjs') || f.endsWith('.json'))
      : [];
    expect(rootScripts, `move or delete: ${rootScripts.join(', ')}`).toEqual([]);
    expect(existsSync(join(ROOT, 'scripts/verify-hero-gutter.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/align-routing-imports.mjs'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/gw5-restructure.mjs'))).toBe(false);
  });

  it('GW6-01: retired FE stubs and lazy re-exports removed', () => {
    expect(existsSync(join(ROOT, 'src/pages/admin/Overview.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/components/plan/PlanCalendarSection.tsx'))).toBe(false);
    expect(existsSync(join(ROOT, 'src/activity/detail/templates/activityConsumerDetailSectionStyles.ts'))).toBe(
      false
    );
    expect(existsSync(join(ROOT, 'src/api/domains/placeRegistry.test.ts'))).toBe(false);
    const lazy = read('src/routing/appLazyPages.tsx');
    expect(lazy).not.toMatch(/export const AdminOverview\b/);
    expect(lazy).not.toMatch(/export const Buddies\b/);
    const availabilityApi = read('src/hooks/memberAvailabilityApi.ts');
    expect(availabilityApi).not.toMatch(/saveMyMemberAvailability/);
  });
});