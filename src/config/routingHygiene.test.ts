import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

/** Files allowed to contain raw `/explore?` query strings. */
const EXPLORE_QUERY_ALLOWLIST = new Set([
  'src/explore/routing.ts',
  'src/explore/compose.ts',
  'src/discovery/discoveryCardModel.ts',
  'src/discovery/discoveryCardModel.ts',
  'src/config/platform.ts',
  'src/config/routingCatalog.ts',
  'src/utils/notificationRouting.ts',
  'src/content/homeLanding.ts',
  'src/config/routingHygiene.test.ts',
]);

/** Files allowed to reference `/activities` as a path (legacy redirect / active-state match). */
const INBOUND_OPERATOR_PATH_ALLOWLIST = new Set([
  'src/App.tsx',
  'src/config/platform.ts',
  'src/config/routingHygiene.test.ts',
]);

const INBOUND_EVENT_PLACE_PATH_ALLOWLIST = new Set([
  'src/App.tsx',
  'src/utils/placePaths.test.ts',
  'src/config/routingHygiene.test.ts',
]);

const ACTIVITIES_PATH_ALLOWLIST = new Set([
  'src/App.tsx',
  'src/constants/index.ts',
  'src/config/platform.ts',
  'src/config/routingCatalog.ts',
  'src/components/layout/MobileBottomNav.tsx',
  'src/config/routingCatalog.ts',
  'src/config/routingHygiene.test.ts',
]);

const INBOUND_MAP_BROWSE_ALLOWLIST = new Set([
  'src/App.tsx',
  'src/config/platform.ts',
  'src/config/routingHygiene.test.ts',
]);

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('routingHygiene', () => {
  it('routingCatalog re-exports entity path and explore helpers', () => {
    const catalog = readFileSync(join(process.cwd(), 'src/config/routingCatalog.ts'), 'utf8');
    expect(catalog).toMatch(/activityDetailPath/);
    expect(catalog).toMatch(/explorePath/);
    expect(catalog).toMatch(/PRO_MEMBERSHIP_PATH/);
    expect(catalog).toMatch(/INBOUND_COMMUNITY_FEED_PATH/);
    expect(catalog).toMatch(/PROFILE_BADGES_PATH/);
  });

  it('app code does not use raw /explore? outside explore routing allowlist', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter((file) => !file.startsWith('src/explore/'));
    const violations: string[] = [];

    for (const file of files) {
      if (EXPLORE_QUERY_ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/(?<![\w])['"`]\/explore\?/.test(content)) {
        violations.push(`${file}: use explorePath() from routingCatalog`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code does not link to legacy /activities hub (use PLAN_PATH)', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];
    const linkPattern =
      /(?:to|href)=["']\/activities(?:[?'"])|navigate\(\s*["']\/activities|path:\s*["']\/activities["']/;

    for (const file of files) {
      if (ACTIVITIES_PATH_ALLOWLIST.has(file)) continue;
      if (file.includes('/api/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (linkPattern.test(content)) {
        violations.push(`${file}: use PLAN_PATH (/plan) from routingCatalog`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code does not link to retired /operator storefront URLs (use publisher / agency / shop helpers)', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];
    const linkPattern =
      /(?:to|href)=\{?[`"']\/operator\/|(?:to|href)=["']\/operator\/|navigate\(\s*[`"']\/operator\/|`\/operator\/\$\{/;

    for (const file of files) {
      if (INBOUND_OPERATOR_PATH_ALLOWLIST.has(file)) continue;
      if (file.includes('/api/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (linkPattern.test(content)) {
        violations.push(`${file}: use resolveActivityPublisherProfilePath / tenantBrandPublicPath / routingCatalog`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code does not link to legacy /event/ place URLs (use /venue/ via placeDetailPath)', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];
    const linkPattern =
      /(?:to|href)=\{?[`"']\/event\/|(?:to|href)=["']\/event\/|navigate\(\s*[`"']\/event\//;

    for (const file of files) {
      if (INBOUND_EVENT_PLACE_PATH_ALLOWLIST.has(file)) continue;
      if (file.includes('/api/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (linkPattern.test(content)) {
        violations.push(`${file}: use placeDetailPath("event", id) → /venue/:id`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code does not link to /map as browse home (use EXPLORE_MAP_PATH / explorePath)', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];
    const linkPattern =
      /(?:to|href)=["']\/map(?:[?'"])|navigate\(\s*["']\/map|path:\s*["']\/map["']/;

    for (const file of files) {
      if (INBOUND_MAP_BROWSE_ALLOWLIST.has(file)) continue;
      if (file.includes('/api/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (linkPattern.test(content)) {
        violations.push(`${file}: use EXPLORE_MAP_PATH or explorePath() — /map is redirect-only`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('App does not register category browse path segments (/browse, catalog /places)', () => {
    const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
    const banned = [
      /path="\/browse\//,
      /path="\/places"/,
      /path="\/places\//,
      /path="\/shops"/,
      /path="\/shops\//,
    ];
    const hits = banned.filter((pattern) => pattern.test(app));
    expect(hits, 'use /explore or /list with query filters per DOMAIN_CANONICALS §4.1').toHaveLength(0);
  });

  it('app code does not introduce /demand/ detail routes', () => {
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/(?:to|href)=["']\/demand\/|navigate\(\s*["']\/demand\//.test(content)) {
        violations.push(`${file}: demand uses explore pin paths, not /demand/:id`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('Navigate-only page shims are gone (COH-12)', () => {
    const gone = [
      'src/pages/ShopManage.tsx',
      'src/pages/AgencyManage.tsx',
      'src/pages/BecomeHost.tsx',
      'src/pages/Membership.tsx',
      'src/pages/MerchantPublic.tsx',
      'src/pages/ProfileWishlist.tsx',
      'src/explore/ui/ExploreComposeHost.tsx',
      'src/pages/Activities.tsx',
      'src/hooks/participantIntentClientApi.ts',
      'src/member-plan/participantIntentTrips.ts',
      'src/member-plan/navigateParticipantIntentManage.ts',
      'src/components/organisation-console/BecomeHostFlow.tsx',
      'src/components/organisation-console/becomeHostForm.ts',
      'src/components/organisation-console/OrganisationConsoleShell.tsx',
    ];
    expect(gone.filter((rel) => existsSync(join(process.cwd(), rel)))).toEqual([]);
  });

  it('App does not lazy-load Navigate-only page modules', () => {
    const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');
    expect(app).not.toMatch(/pages\/ShopManage/);
    expect(app).not.toMatch(/pages\/AgencyManage/);
    expect(app).not.toMatch(/pages\/BecomeHost/);
    expect(app).not.toMatch(/pages\/Membership/);
    expect(app).not.toMatch(/pages\/MerchantPublic/);
  });

  it('app code does not link to /shop/manage or /agency/manage (use organisationManagePath)', () => {
    const allow = new Set([
      'src/App.tsx',
      'src/utils/authRedirect.ts',
      'src/config/platform.ts',
      'src/member/organisationPaths.ts',
      'src/config/routingHygiene.test.ts',
    ]);
    const files = collectSourceFiles(SCAN_ROOT);
    const violations: string[] = [];
    const linkPattern =
      /(?:to|href)=["']\/(?:shop|agency)\/manage|navigate\(\s*["']\/(?:shop|agency)\/manage/;

    for (const file of files) {
      if (allow.has(file) || file.includes('/api/')) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (linkPattern.test(content)) {
        violations.push(`${file}: use organisationManagePath()`);
      }
    }

    expect(violations).toEqual([]);
  });
});
