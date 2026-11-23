import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

const ALLOW_HOST_CONSOLE_PATHS = new Set([
  'src/App.tsx',
  'src/routing/AppRoutes.tsx',
  'src/config/surfacePaths.ts',
  'src/config/surfacePaths.test.ts',
  'src/config/routingCatalog.ts',
  'src/constants/index.ts',
  'src/console/ConsoleHubSections.tsx',
  'src/components/layout/MobileMenu.tsx',
  'src/pages/SecurityPrivacy.tsx',
  'src/pages/Messages.tsx',
  'src/utils/authRouting.ts',
  'src/utils/authRouting.test.ts',
  'src/utils/authRedirect.test.ts',
  'src/config/systemCoherenceGuard.test.ts',
  'src/config/discoverBrowseNav.test.ts',
  'src/utils/notificationRouting.ts',
  'src/utils/notificationRouting.test.ts',
  'src/member/memberSurfacesAcceptance.test.ts',
  'src/member/hostMemberGuard.test.ts',
  'src/config/desktopNav.test.ts',
  'src/config/desktopNav.ts',
  'src/config/platform.ts',
  'src/routing/planBrowseRoute.tsx',
  'src/pages/publishing/Overview.tsx',
]);

/** Legacy host workspace (`/host/*` pages) — not consumer Plan/Profile surfaces. */
const SKIP_HOST_CONSOLE_PREFIXES = [
  'src/pages/publishing/',
  'src/components/activity/',
  'src/console/',
  'src/hosting/',
];

const ALLOW_BECOME_HOST_PATH = new Set([
  'src/config/memberRoutes.ts',
  'src/config/platform.ts',
  'src/utils/proMembershipSurfaceGuard.test.ts',
  'src/components/organisation-console/hostWizardFlow.ts',
  'src/components/organisation-console/hostWizardFlow.test.ts',
  'src/components/organisation-console/ProProfileApplicationFlow.tsx',
  'src/pages/ProfileProMembership.tsx',
  'src/App.tsx',
]);

const SKIP_PREFIXES = ['src/api/', 'src/member/hostMemberGuard.test.ts'];

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('hostMemberGuard', () => {
  it('consumer UI does not link to /become-host (use PRO_MEMBERSHIP_PATH)', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) =>
        !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        !ALLOW_BECOME_HOST_PATH.has(file)
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/to=["']\/become-host|navigate\(\s*['"]\/become-host|href=["']\/become-host/.test(content)) {
        violations.push(`${file}: use PRO_MEMBERSHIP_PATH or proMembershipPath()`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('consumer UI does not deep-link to publishing console overview (use Plan, explore organize, or pro membership)', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) =>
        !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        !SKIP_HOST_CONSOLE_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        !ALLOW_HOST_CONSOLE_PATHS.has(file)
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (
        /['"]\/host\/overview['"]/.test(content) ||
        /['"]\/operator\/overview['"]/.test(content) ||
        /to=\{HOST_OVERVIEW_PATH\}/.test(content) ||
        /to=\{OPERATOR_OVERVIEW_PATH\}/.test(content) ||
        /to:\s*HOST_OVERVIEW_PATH/.test(content) ||
        /to:\s*OPERATOR_OVERVIEW_PATH/.test(content)
      ) {
        violations.push(`${file}: use exploreHostPath(), planHostedSchedulePath(), or PRO_MEMBERSHIP_PATH`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('consumer UI does not deep-link to publishing console tenant routes', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) =>
        !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        !SKIP_HOST_CONSOLE_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        !ALLOW_HOST_CONSOLE_PATHS.has(file)
    );
    const violations: string[] = [];

    const literalHostConsole =
      /['"]\/(?:host|operator)\/(requests|activities(?:\/new)?|team)['"]/;
    const hostConsoleConstants =
      /to=\{(HOST|OPERATOR)_(REQUESTS|ACTIVITIES|TEAM)_PATH\}|to:\s*(HOST|OPERATOR)_(REQUESTS|ACTIVITIES|TEAM)_PATH|to=\{(HOST|OPERATOR)_ACTIVITIES_NEW_PATH\}/;

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (literalHostConsole.test(content) || hostConsoleConstants.test(content)) {
        violations.push(
          `${file}: use planHostedSchedulePath(), MY_REQUESTS_PATH, or PRO_MEMBERSHIP_PATH — not consumer /operator/*`
        );
      }
    }

    expect(violations).toEqual([]);
  });

  it('product gates do not use isHostRole (use useMemberStatus / canAccessPublishingWorkspace)', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) => file !== 'src/utils/roles.ts' && !file.endsWith('.test.ts')
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/\bisHostRole\s*\(/.test(content)) {
        violations.push(`${file}: use useMemberStatus / canAccessPublishingWorkspace`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('app code imports tenantActivityClientApi (not legacy host/operator client shims)', () => {
    const allow = new Set(['src/hooks/tenantActivityClientApi.ts']);
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) => !allow.has(file) && !file.endsWith('.test.ts')
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/from\s+['"].*hostActivityClientApi['"]/.test(content)) {
        violations.push(`${file}: import tenantActivityClientApi`);
      }
      if (/from\s+['"].*operatorActivityClientApi['"]/.test(content)) {
        violations.push(`${file}: import tenantActivityClientApi`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('consumer code imports useMemberStatus (not deprecated status shims)', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter((file) => !file.endsWith('.test.ts'));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/from\s+['"].*useHostStatus['"]/.test(content)) {
        violations.push(`${file}: import useMemberStatus`);
      }
      if (/from\s+['"].*useOperatorStatus['"]/.test(content)) {
        violations.push(`${file}: import useMemberStatus`);
      }
      if (/from\s+['"].*usePublishingAccess['"]/.test(content)) {
        violations.push(`${file}: import useMemberStatus`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('member status reads prefer getMemberStatus over legacy aliases', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) =>
        !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        (file.startsWith('src/hooks/') ||
          file.startsWith('src/pages/') ||
          file.startsWith('src/components/'))
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      if (/\bapi\.getMyOrganisationStatus\s*\(/.test(content)) {
        violations.push(`${file}: use api.getMemberStatus()`);
      }
      if (/\bapi\.getMember(Host|Operator)Status\s*\(/.test(content)) {
        violations.push(`${file}: use api.getMemberStatus()`);
      }
    }

    expect(violations).toEqual([]);
  });
});
