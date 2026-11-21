import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const manifest = JSON.parse(
  read('scripts/bounded-context-manifest.json')
) as { contexts: Array<{ id: string }> };

/** §3.1 matrix rows (excludes cross-cut footnote row). */
const COHERENCE_CONTEXT_IDS = [
  'discovery',
  'compose',
  'participation',
  'member_discovery',
  'member_identity',
  'member_publish_capabilities',
  'publishing_workspace',
  'communication',
  'social_graph',
  'places',
  'facilities',
  'shop_profiles',
  'engagement',
  'platform_ops',
] as const;

const PUBLISHING_WORKSPACE_DOMAIN = 'src/api/domains/publishingWorkspace.ts';

const TENANT_DOMAIN_MODULES = [PUBLISHING_WORKSPACE_DOMAIN] as const;

describe('crossContextFoundationsGuard', () => {
  it('CTX-FOUND-01: manifest contexts are documented in SYSTEM_COHERENCE §3.1', () => {
    const coherence = read('docs/SYSTEM_COHERENCE.md');
    const manifestIds = new Set(manifest.contexts.map((c) => c.id));
    const missingInCoherence: string[] = [];
    const EXTRA_MANIFEST_CONTEXTS = ['areas', 'availability', 'media'] as const;
    for (const id of manifestIds) {
      if (COHERENCE_CONTEXT_IDS.includes(id as (typeof COHERENCE_CONTEXT_IDS)[number])) continue;
      if (EXTRA_MANIFEST_CONTEXTS.includes(id as (typeof EXTRA_MANIFEST_CONTEXTS)[number])) {
        if (!coherence.includes(id)) missingInCoherence.push(id);
        continue;
      }
      missingInCoherence.push(id);
    }
    for (const id of COHERENCE_CONTEXT_IDS) {
      expect(coherence).toMatch(new RegExp(`\\| ${id} \\|`));
    }
    expect(missingInCoherence).toEqual([]);
  });

  it('CTX-FOUND-02: tenant HTTP uses /publishing + organisationRequestHeaders (one methodology)', () => {
    const violations: string[] = [];
    for (const file of TENANT_DOMAIN_MODULES) {
      const content = read(file);
      if (content.includes('/publishing/')) {
        if (!content.includes('organisationRequestHeaders')) {
          violations.push(`${file}: /publishing without organisationRequestHeaders`);
        }
      }
      if (/['"`]\/operator\//.test(content)) {
        violations.push(`${file}: legacy /operator HTTP path`);
      }
      if (/x-tenant-id/i.test(content)) {
        violations.push(`${file}: legacy x-tenant-id header`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('CTX-FOUND-02b: /publishing HTTP only in publishingWorkspace domain module', () => {
    const domainDir = join(ROOT, 'src/api/domains');
    const violations: string[] = [];
    for (const name of readdirSync(domainDir)) {
      if (!name.endsWith('.ts') || name.endsWith('.test.ts') || name === 'index.ts') continue;
      const rel = `src/api/domains/${name}`;
      if (rel === PUBLISHING_WORKSPACE_DOMAIN) continue;
      const content = read(rel);
      if (content.includes('/publishing/')) {
        violations.push(`${rel}: move /publishing/* to publishingWorkspace.ts`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('CTX-FOUND-03: activity entity — public join/detail vs tenant publish (workspace isolated)', () => {
    const activities = read('src/api/domains/activities.ts');
    expect(activities).toMatch(/`\/activities\?/);
    expect(activities).toMatch(/`\/activities\/\$\{/);
    expect(activities).toMatch(/\/activities\/.*\/requests/);
    expect(activities).not.toMatch(/\/publishing\/activities/);
    expect(activities).not.toMatch(/\/me\/activities\/.*\/publish/);

    const workspace = read(PUBLISHING_WORKSPACE_DOMAIN);
    expect(workspace).toMatch(/\/publishing\/activities/);
    expect(workspace).toMatch(/organisationRequestHeaders/);

    const availability = read('src/api/domains/availability.ts');
    expect(availability).toMatch(/\/me\/availability/);
    expect(availability).not.toMatch(/\/me\/seeking-posts/);
  });

  it('CTX-FOUND-04: discovery read model — one map catalog + overlay (no second discovery API in exploreApi)', () => {
    const explore = read('src/api/domains/explore.ts');
    expect(explore).toMatch(/\/explore\/map/);
    expect(explore).toMatch(/\/me\/discover\/overlay/);
    expect(explore).not.toMatch(/\/discovery\/catalog/);
    expect(explore).not.toMatch(/\/map\/activities/);
  });

  it('CTX-FOUND-05: member capabilities resolver — single /me/status entry in member domain', () => {
    const member = read('src/api/domains/member.ts');
    expect(member).toMatch(/\/me\/status/);
    const domainDir = join(ROOT, 'src/api/domains');
    const violations: string[] = [];
    for (const name of readdirSync(domainDir)) {
      if (!name.endsWith('.ts') || name === 'member.ts' || name.endsWith('.test.ts') || name === 'index.ts') {
        continue;
      }
      const content = read(`src/api/domains/${name}`);
      if (/\/me\/status/.test(content) && !content.includes('@deprecated')) {
        violations.push(`src/api/domains/${name}: duplicate /me/status client`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('CTX-FOUND-06: cross-context engagement policy lives in shared-types (peek + detail parity)', () => {
    expect(read('packages/shared-types/src/activity-engagement-policy.ts')).toMatch(
      /resolveActivityEngagementPolicy/
    );
    expect(read('src/activity/mapDetailEngagementParity.test.ts')).toMatch(/resolveActivityEngagementPolicy/);
    expect(read('src/hooks/useActivityJoinFlow.ts')).toBeTruthy();
  });

  it('CTX-FOUND-07: SPA paths use routing catalog — publishing console constants are /publishing/*', () => {
    const surface = read('src/config/surfacePaths.ts');
    expect(surface).toMatch(/PUBLISHING_OVERVIEW_PATH = '\/publishing\/overview'/);
    expect(surface).toMatch(/PUBLISHING_REQUESTS_PATH = '\/publishing\/requests'/);
    expect(read('src/config/routingCatalog.ts')).toMatch(/surfacePaths/);
  });

  const FACADE_DOMAIN_MODULES = ['messaging.ts', 'memberCommitmentHub.ts'] as const;

  it('CTX-FOUND-08: facade domains compose *Api modules — no second HTTP client stack', () => {
    for (const name of FACADE_DOMAIN_MODULES) {
      const content = read(`src/api/domains/${name}`);
      expect(content).not.toMatch(/apiRequest\s*\(/);
    }
    expect(read('src/api/domains/messaging.ts')).toMatch(/chatApi/);
    expect(read('src/api/domains/messaging.ts')).toMatch(/groupsApi/);
    expect(read('src/api/domains/memberCommitmentHub.ts')).toMatch(/goalsApi/);
    expect(read('src/api/domains/memberCommitmentHub.ts')).toMatch(/availabilityApi/);
  });

  it('CTX-FOUND-09: member_discovery browse — /me/member-discovery client only in account domain', () => {
    const domainDir = join(ROOT, 'src/api/domains');
    const violations: string[] = [];
    for (const name of readdirSync(domainDir)) {
      if (!name.endsWith('.ts') || name === 'account.ts' || name.endsWith('.test.ts') || name === 'index.ts') {
        continue;
      }
      const content = read(`src/api/domains/${name}`);
      if (/\/me\/member-discovery/.test(content)) violations.push(`src/api/domains/${name}`);
    }
    expect(violations).toEqual([]);
  });

  it('CTX-FOUND-11: product data lineage — one map catalog read model; marketing + list delegate to API/modules', () => {
    expect(read('src/config/productDataLineageGuard.test.ts')).toMatch(/CTX-DATA-01/);
    expect(read('src/list/browseListFilters.ts')).toMatch(/listAvailabilityCatalog/);
    expect(read('apps/api/src/lib/discovery-catalog-builder.ts')).not.toMatch(
      /overlayCatalogDefaultsOnLocation/
    );
    expect(read('src/hooks/useHomeLandingActivities.ts')).not.toMatch(/HOME_LANDING_FALLBACK/);
    expect(read('src/hooks/useHomeLandingActivities.ts')).toMatch(/getFeaturedActivities/);
    expect(existsSync(join(ROOT, 'src/hooks/useHomeMarketingReviews.ts'))).toBe(true);
  });

  it('CTX-FOUND-10: communication — /chat/* wire paths only in chat domain (messaging is façade)', () => {
    const domainDir = join(ROOT, 'src/api/domains');
    const violations: string[] = [];
    for (const name of readdirSync(domainDir)) {
      if (
        !name.endsWith('.ts') ||
        name === 'chat.ts' ||
        name === 'messaging.ts' ||
        name.endsWith('.test.ts') ||
        name === 'index.ts'
      ) {
        continue;
      }
      const content = read(`src/api/domains/${name}`);
      if (/\/chat\//.test(content)) violations.push(`src/api/domains/${name}`);
    }
    expect(violations).toEqual([]);
  });

  it('CTX-FOUND-11: places catalog read — GET /places/catalog client only in placeCatalogClient', () => {
    const domainDir = join(ROOT, 'src/api/domains');
    const violations: string[] = [];
    for (const name of readdirSync(domainDir)) {
      if (!name.endsWith('.ts') || name === 'placeCatalogClient.ts' || name.endsWith('.test.ts')) {
        continue;
      }
      const content = read(`src/api/domains/${name}`);
      if (/\/places\/catalog/.test(content)) violations.push(`src/api/domains/${name}`);
    }
    expect(violations).toEqual([]);
  });

  it('CTX-FOUND-12: public facility detail — GET /facilities/:id client only in facilities domain', () => {
    const domainDir = join(ROOT, 'src/api/domains');
    const violations: string[] = [];
    for (const name of readdirSync(domainDir)) {
      if (!name.endsWith('.ts') || name === 'facilities.ts' || name.endsWith('.test.ts')) {
        continue;
      }
      const content = read(`src/api/domains/${name}`);
      if (/\/facilities\/\$\{/.test(content) || /`\/facilities\/\$\{/.test(content)) {
        violations.push(`src/api/domains/${name}`);
      }
      if (/apiRequest[^;]*['"`]\/facilities\/[^'"]+['"`]/.test(content)) {
        violations.push(`src/api/domains/${name}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
