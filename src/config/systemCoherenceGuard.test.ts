import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const DOCS_EXPERIMENT = join(ROOT, 'docs', 'experiment');
const API_SRC = join(ROOT, 'apps', 'api', 'src');

/** Surface literals that must come from routingCatalog in UI code. */
const SURFACE_LINKS: Array<{ path: string; constant: string }> = [
  { path: '/buddies', constant: 'BUDDIES_PATH' },
  { path: '/groups', constant: 'GROUPS_PATH' },
  { path: '/profile/submissions', constant: 'PROFILE_SUBMISSIONS_PATH' },
  { path: '/profile/badges', constant: 'PROFILE_BADGES_PATH' },
  { path: '/my-requests', constant: 'MY_REQUESTS_PATH' },
  { path: '/chat', constant: 'MESSAGES_PATH' },
  { path: '/notifications', constant: 'NOTIFICATIONS_PATH' },
  { path: '/profile', constant: 'PROFILE_PATH' },
  { path: '/profile/settings', constant: 'PROFILE_SETTINGS_PATH' },
  { path: '/publishing/activities', constant: 'PUBLISHING_ACTIVITIES_PATH' },
  { path: '/publishing/requests', constant: 'PUBLISHING_REQUESTS_PATH' },
];

const SURFACE_LITERAL_ALLOWLIST = new Set([
  'src/App.tsx',
  'src/config/surfacePaths.ts',
  'src/config/routingCatalog.ts',
  'src/config/platform.ts',
  'src/config/memberRoutes.ts',
  'src/config/mobileBottomNav.test.ts',
  'src/utils/notificationRouting.test.ts',
  'src/config/systemCoherenceGuard.test.ts',
  'src/config/routingHygiene.test.ts',
  'src/config/routingCatalogAdoption.test.ts',
  'src/components/mobile/MobileTabHeader.tsx',
  'src/pages/SignIn.tsx',
  'src/pages/SignUp.tsx',
  'src/pages/VerifyOTP.tsx',
  'src/pages/ForgotPassword.tsx',
  'src/pages/WelcomeSignup.tsx',
  'src/components/profile/ProfileSettingsLink.tsx',
]);

const collectFiles = (dir: string, acc: string[] = []): string[] => {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'api') continue;
      collectFiles(full, acc);
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx')) &&
      !entry.endsWith('.test.ts') &&
      !rel.includes('/api/')
    ) {
      acc.push(rel);
    }
  }
  return acc;
};

const collectMarkdown = (dir: string, acc: string[] = []): string[] => {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectMarkdown(full, acc);
    else if (entry.endsWith('.md')) acc.push(relative(ROOT, full).replace(/\\/g, '/'));
  }
  return acc;
};

const UI_SCAN_DIRS = ['pages', 'components', 'explore'].map((d) => join(SRC, d));

describe('systemCoherenceGuard', () => {
  it('consumer UI links use routingCatalog surface constants (not raw hub paths)', () => {
    const files = UI_SCAN_DIRS.flatMap((dir) => collectFiles(dir));
    const linkPattern = (path: string) =>
      new RegExp(`(?:to|href)=["']${path.replace(/\//g, '\\/')}["']`);

    const violations: string[] = [];
    for (const file of files) {
      if (SURFACE_LITERAL_ALLOWLIST.has(file)) continue;
      const content = readFileSync(join(ROOT, file), 'utf8');
      for (const { path, constant } of SURFACE_LINKS) {
        if (linkPattern(path).test(content)) {
          violations.push(`${file}: use ${constant} from config/routingCatalog`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('notificationRouting uses catalog constants for social fallbacks', () => {
    const file = 'src/utils/notificationRouting.ts';
    const content = readFileSync(join(ROOT, file), 'utf8');
    expect(content).toMatch(/BUDDIES_PATH/);
    expect(content).toMatch(/GROUPS_PATH/);
    expect(content).toMatch(/messagesGroupPath/);
    expect(content).toMatch(/INBOUND_PLAN_HUB_TRIPS_MAP_PATH/);
    expect(content).not.toMatch(/return '\/buddies'/);
    expect(content).not.toMatch(/return '\/groups'/);
    expect(content).not.toMatch(/return `\/messages\?group=/);
    expect(content).not.toMatch(/pathname === '\/trips\/map'/);
  });

  it('experiment docs do not contradict Tier-1 badges and Pro entry', () => {
    const violations: string[] = [];
    const badPatterns: Array<{ pattern: RegExp; label: string }> = [
      {
        pattern: /\/profile\/badges` redirect to \*\*`\/profile`\*\*/i,
        label: 'badges redirect to /profile only — use PROFILE_BADGES_PATH',
      },
      {
        pattern: /product entry.*`\/become-host`/i,
        label: 'Pro entry must be /profile/pro-membership',
      },
    ];

    for (const rel of collectMarkdown(DOCS_EXPERIMENT)) {
      const text = readFileSync(join(ROOT, rel), 'utf8');
      for (const { pattern, label } of badPatterns) {
        if (pattern.test(text)) violations.push(`${rel}: ${label}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('API does not ship Trail Points wallet registrars or config', () => {
    const userRoutes = join(API_SRC, 'routes', 'user');
    expect(existsSync(join(userRoutes, 'registerMeRewardsRoutes.ts'))).toBe(false);
    expect(existsSync(join(userRoutes, 'registerPublicRewardsRoutes.ts'))).toBe(false);
    expect(existsSync(join(API_SRC, 'lib', 'rewards-config.ts'))).toBe(false);
    const userRouter = readFileSync(join(API_SRC, 'routes', 'user.ts'), 'utf8');
    const memberCompose = readFileSync(
      join(API_SRC, 'routes', 'user', 'composeUserMemberRoutes.ts'),
      'utf8'
    );
    expect(userRouter).not.toMatch(/registerMeRewardsRoutes|registerPublicRewardsRoutes/);
    expect(memberCompose).toMatch(/registerMeBadgesRoutes/);
  });

  it('apps/api routes do not register /me/rewards or public rewards catalog', () => {
    const routesDir = join(API_SRC, 'routes');
    const violations: string[] = [];
    for (const file of collectFiles(routesDir)) {
      const content = readFileSync(join(ROOT, file), 'utf8');
      if (/\/me\/rewards|\/rewards\/catalog|\/rewards\/leaderboard/.test(content)) {
        violations.push(`${file}: Trail Points wallet HTTP surface removed`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('member inbox surfaces guard mount fetches with useSafeAsyncEffect', () => {
    const memberAsyncPages: string[] = [];
    const missing: string[] = [];
    for (const rel of memberAsyncPages) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!content.includes('useSafeAsyncEffect')) {
        missing.push(rel);
      }
    }
    expect(missing).toEqual([]);
  });

  it('S10a consumer pages guard async mount fetches with useSafeAsyncEffect', () => {
    const s10aPages: string[] = [];
    const missing: string[] = [];
    for (const rel of s10aPages) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!content.includes('useSafeAsyncEffect')) {
        missing.push(rel);
      }
    }
    expect(missing).toEqual([]);
  });

  it('explore detail and peek hooks guard mount fetch with useSafeAsyncEffect', () => {
    const exploreAsyncHooks: string[] = [];
    const missing: string[] = [];
    for (const rel of exploreAsyncHooks) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!content.includes('useSafeAsyncEffect')) {
        missing.push(rel);
      }
    }
    expect(missing).toEqual([]);
  });

  it('ProtectedRoute redirects non-tenant roles off publishing console via isPublishingConsolePath', () => {
    const content = readFileSync(join(ROOT, 'src/components/auth/ProtectedRoute.tsx'), 'utf8');
    expect(content).toMatch(/isPublishingConsolePath/);
    expect(content).toMatch(/participantHostBookmarkRedirect/);
    expect(content).not.toMatch(/pathname\.startsWith\(['"]\/host['"]\)/);
  });

  it('S10b host console guards mount fetches with useSafeAsyncEffect', () => {
    const hostPages = [
      'src/pages/publishing/Activities.tsx',
      'src/pages/publishing/JoinRequests.tsx',
      'src/pages/publishing/Places.tsx',
      'src/pages/publishing/History.tsx',
      'src/pages/publishing/Team.tsx',
      'src/pages/publishing/PublicProfileEdit.tsx',
    ];
    const hostShell = ['src/console/ConsoleShell.tsx'];
    const missing: string[] = [];
    for (const rel of [...hostPages, ...hostShell]) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!content.includes('useSafeAsyncEffect')) {
        missing.push(rel);
      }
    }
    expect(missing).toEqual([]);
  });

  it('member profile hooks use TanStack Query for server reads', () => {
    const memberQueryHooks = [
      'src/hooks/useMemberGoals.ts',
      'src/hooks/useMemberStatus.ts',
      'src/hooks/useMemberAvailability.ts',
    ];
    const missing: string[] = [];
    for (const rel of memberQueryHooks) {
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!content.includes('useQuery')) {
        missing.push(`${rel}: missing useQuery`);
      }
      if (content.includes('useSafeAsyncEffect')) {
        missing.push(`${rel}: still uses useSafeAsyncEffect`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('workspace vocabulary module is canonical for organizer/operator copy', () => {
    expect(existsSync(join(ROOT, 'src/content/workspaceVocabulary.ts'))).toBe(true);
    const vocab = readFileSync(join(ROOT, 'src/content/workspaceVocabulary.ts'), 'utf8');
    expect(vocab).toMatch(/Publishing workspace/);
    expect(vocab).toMatch(/Operator workspace/);
    expect(existsSync(join(ROOT, 'src/content/workspaceVocabulary.ts'))).toBe(true);
    expect(existsSync(join(ROOT, 'src/content/workspaceProductLanguageGuard.test.ts'))).toBe(true);
  });

  it('S10e staging checklist script is wired in package.json', () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, 'package.json'), 'utf8')
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['s10e:staging-checklist']).toMatch(/s10e-staging-bbox-checklist/);
    expect(pkg.scripts?.['s10e:local-ratio']).toMatch(/s10e-local-bbox-ratio/);
    expect(existsSync(join(ROOT, 'scripts/s10e-staging-bbox-checklist.mjs'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/s10e-local-bbox-ratio.mjs'))).toBe(true);
  });

  it('P5 SLO smoke script is wired and documents join + bbox probes', () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, 'package.json'), 'utf8')
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['p5:slo-smoke']).toMatch(/p5-slo-smoke/);
    expect(pkg.scripts?.['p5:slo-preflight']).toMatch(/--preflight/);
    const script = readFileSync(join(ROOT, 'scripts/p5-slo-smoke.mjs'), 'utf8');
    expect(script).toMatch(/P5_JOIN_ACTIVITY_ID/);
    expect(script).toMatch(/P5_EXPLORE_MAP_BBOX/);
    expect(script).toMatch(/localhost:4000/);
    expect(script).toMatch(/JSON\.stringify\(\{ note:/);
    const preDeploy = readFileSync(join(ROOT, 'docs/PRE_DEPLOY_CHECKLIST.md'), 'utf8');
    expect(preDeploy).toMatch(/SLO baseline \(P5/);
    expect(preDeploy).toMatch(/p5:slo-smoke/);
    expect(preDeploy).toMatch(/p5:slo-preflight/);
  });

  it('S10e explore map bbox stays opt-in via explicit env flag', () => {
    const fe = readFileSync(join(ROOT, 'src/explore/exploreMapBbox.ts'), 'utf8');
    expect(fe).toMatch(/VITE_EXPLORE_MAP_BBOX === '1'/);
    const api = readFileSync(
      join(ROOT, 'apps/api/src/lib/explore-map-bbox.ts'),
      'utf8'
    );
    expect(api).toMatch(/EXPLORE_MAP_BBOX\?\.trim\(\) === '1'/);
  });

  it('MIG-EXPLORE-READ discovery projection stays opt-in via explicit env flag', () => {
    const fe = readFileSync(join(ROOT, 'src/explore/exploreMapDiscoveryProjection.ts'), 'utf8');
    expect(fe).toMatch(/VITE_EXPLORE_MAP_DISCOVERY_PROJECTION === '1'/);
    const api = readFileSync(
      join(ROOT, 'apps/api/src/lib/explore-map-discovery-projection.ts'),
      'utf8'
    );
    expect(api).toMatch(/EXPLORE_MAP_DISCOVERY_PROJECTION\?\.trim\(\) === '1'/);
    const route = readFileSync(join(ROOT, 'apps/api/src/lib/explore-map-route.ts'), 'utf8');
    expect(route).toMatch(/enrichExploreMapItemsDiscoveryProjection/);
  });

  it('S10d activity pin deep link callback avoids whole browse object in deps', () => {
    const content = readFileSync(
      join(ROOT, 'src/explore/ui/useExploreActivityPinDeepLink.ts'),
      'utf8'
    );
    const block = content.slice(
      content.indexOf('const tryOpenActivityPinDeepLink = useCallback'),
      content.indexOf('return { tryOpenActivityPinDeepLink }')
    );
    expect(block).toMatch(/setListOpen/);
    expect(block).not.toMatch(/browse,/);
    expect(block).not.toMatch(/browse\./);
    const selection = readFileSync(
      join(ROOT, 'src/explore/ui/useExploreSelectionActions.ts'),
      'utf8'
    );
    expect(selection).toMatch(/useExploreActivityPinDeepLink/);
    expect(selection).toMatch(/useExploreSelectionPeekJoin/);
    expect(selection.split(/\r?\n/).length).toBeLessThan(400);
  });

  it('S10d organize-from-activity effect includes host gate inputs in deps', () => {
    const content = readFileSync(
      join(ROOT, 'src/explore/create/hooks/useHostingFromActivity.ts'),
      'utf8'
    );
    const effectBlock = content.slice(content.indexOf('parseHostFromActivityId(searchParams)'), content.indexOf('const clearHostingFromActivityPrefill'));
    expect(effectBlock).toMatch(/isCommunityHost/);
    expect(effectBlock).toMatch(/hostTiers/);
  });

  it('C18 explore shell model composes map catalog, rideshare, and browse shared hooks', () => {
    const modelPath = join(ROOT, 'src/explore/shell/useExploreExperienceModel.ts');
    const model = readFileSync(modelPath, 'utf8');
    expect(model).toMatch(/useExploreMapCatalog/);
    expect(model).toMatch(/useHostingWizardPrefill/);
    expect(model).not.toMatch(/useExploreBrowsePanelShared/);
    expect(model.split(/\r?\n/).length).toBeLessThan(445);
    const experience = readFileSync(join(ROOT, 'src/explore/ui/ExploreExperience.tsx'), 'utf8');
    expect(experience.split(/\r?\n/).length).toBeLessThan(280);
  });

  it('S10d explore browse URL migrations patch search params without syncExploreUrl', () => {
    const migrations = readFileSync(
      join(ROOT, 'src/explore/ui/useExploreBrowseUrlInboundMigrations.ts'),
      'utf8'
    );
    expect(migrations).not.toMatch(/syncExploreUrl/);
    expect(migrations).toMatch(/listDiscoveryPathFromExploreSearch/);
    expect(migrations).toMatch(/replace: true/);
    const browseHook = readFileSync(
      join(ROOT, 'src/explore/ui/useExploreBrowseUrlState.ts'),
      'utf8'
    );
    expect(browseHook).toMatch(/buildExploreBrowseSearchParams/);
    expect(browseHook).toMatch(/parseExploreBrowseStateFromSearchParams/);
    expect(browseHook).toMatch(/useExploreBrowseUrlApplyHandlers/);
    expect(browseHook.split(/\r?\n/).length).toBeLessThan(320);
  });

  it('admin console pages guard mount fetches with useSafeAsyncEffect', () => {
    const pagesDir = join(SRC, 'pages', 'admin');
    const adminPages = readdirSync(pagesDir).filter((name) => name.endsWith('.tsx'));
    const missing: string[] = [];
    for (const name of adminPages) {
      const rel = `src/pages/admin/${name}`;
      const content = readFileSync(join(ROOT, rel), 'utf8');
      if (!content.includes('useSafeAsyncEffect')) {
        missing.push(rel);
      }
    }
    expect(missing).toEqual([]);
  });
});
