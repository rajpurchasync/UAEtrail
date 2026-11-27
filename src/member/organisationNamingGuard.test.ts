import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOT = join(ROOT, 'src');

/** Retired host-console / form-modal stack — must not exist on disk (use `src/operator/desk/*`, Explore Host). */
const RETIRED_PATHS = [
  'src/pages/OrganisationActivities.tsx',
  'src/pages/OrganisationConsoleOverview.tsx',
  'src/pages/OrganisationHistory.tsx',
  'src/pages/OrganisationJoinRequests.tsx',
  'src/pages/OrganisationManage.tsx',
  'src/pages/OrganisationPlaces.tsx',
  'src/pages/OrganisationPublicProfileEdit.tsx',
  'src/pages/OrganisationTeam.tsx',
  'src/pages/activities/HostedSection.tsx',
  'src/context/ActivityFormSessionContext.tsx',
  'src/hooks/useOrganisationGate.ts',
  'src/hooks/useOrganisationHubData.ts',
  'src/hooks/useOrganisationActivityHostActions.ts',
  'src/api/legacyApi.ts',
  'src/components/activities/CreateActivityModal.tsx',
  'src/components/activities/HikingActivityFormModal.tsx',
  'src/components/activities/CampingActivityFormModal.tsx',
  'src/components/activities/useOrganisationActivityFormModal.ts',
  'src/components/activities/activityFormState.ts',
  'src/utils/activityFormSessionStorage.ts',
  'src/components/organisation-console/OrganisationActivityCheckInPanel.tsx',
  'src/components/organisation-console/BecomeHostFlow.tsx',
  'src/components/organisation-console/becomeHostForm.ts',
  'src/components/organisation-console/OrganisationConsoleShell.tsx',
  'src/components/organisation-console/OrganisationJoinRequestCard.tsx',
  'src/components/organisation-console/OrganisationJoinRequestDeclineDialog.tsx',
  'src/components/organisation-console/OrganisationRatingChip.tsx',
  'src/hooks/useOperatorActivityManageActions.ts',
  'src/pages/OrganisationProfile.tsx',
  'src/hooks/organisationConsoleApi.ts',
  'src/api/domains/organisation.ts',
  'src/pages/admin/Organisations.tsx',
];

const DEPRECATED_HOST_PAGE_IMPORTS = RETIRED_PATHS.filter((p) => p.startsWith('src/pages/Organisation'));

/** Public tenant storefront lives under `src/operator/public/`, not `src/pages/Organisation*`. */
const ALLOWED_ORGANISATION_PAGE_FILES = new Set<string>();

const REQUIRED_HOST_CONSOLE_PAGES = [
  'src/operator/desk/Overview.tsx',
  'src/operator/desk/Activities.tsx',
  'src/operator/desk/JoinRequests.tsx',
  'src/operator/desk/Team.tsx',
  'src/operator/desk/Places.tsx',
  'src/operator/desk/History.tsx',
  'src/operator/desk/PublicProfileEdit.tsx',
  'src/operator/desk/Manage.tsx',
];

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(relative(ROOT, full).replace(/\\/g, '/'));
    }
  }
  return files;
};

describe('organisationNamingGuard', () => {
  it('retired Organisation* host console and activity form files stay deleted', () => {
    const present = RETIRED_PATHS.filter((rel) => existsSync(join(ROOT, rel)));
    expect(present).toEqual([]);
  });

  it('stale organisation/publishing UI folders stay deleted', () => {
    const staleDirs = [
      'src/pages/publishing',
      'src/console',
      'src/components/organisation-console',
      'src/components/organisation',
      'src/organisation',
    ];
    expect(staleDirs.filter((rel) => existsSync(join(ROOT, rel)))).toEqual([]);
  });

  it('publishing console route pages live under src/operator/desk/', () => {
    const missing = REQUIRED_HOST_CONSOLE_PAGES.filter((rel) => !existsSync(join(ROOT, rel)));
    expect(missing).toEqual([]);
  });

  it('no Organisation* route pages remain under src/pages/', () => {
    const pagesDir = join(ROOT, 'src/pages');
    if (!existsSync(pagesDir)) {
      expect(pagesDir).toBeTruthy();
      return;
    }
    const organisationPages = readdirSync(pagesDir).filter((name) => /^Organisation.*\.tsx$/.test(name));
    const unexpected = organisationPages.filter((name) => !ALLOWED_ORGANISATION_PAGE_FILES.has(name));
    expect(unexpected).toEqual([]);
  });

  it('app code does not import deleted Organisation* host console pages', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx')
    );
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(join(ROOT, file), 'utf8');
      for (const legacy of DEPRECATED_HOST_PAGE_IMPORTS) {
        const short = legacy.replace('src/pages/', '');
        if (content.includes(`/${legacy}`) || content.includes(`'./${short}`) || content.includes(`"./${short}`)) {
          violations.push(`${file}: use src/operator/desk/* instead of ${legacy}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('git index does not re-add retired host console pages (commit deletions)', () => {
    let tracked: string[];
    try {
      tracked = execSync('git ls-files "src/pages/Organisation*.tsx"', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((p) => p.replace(/\\/g, '/'));
    } catch {
      tracked = [];
    }
    const retiredTracked = tracked.filter(
      (p) => p !== 'src/operator/public/OrganisationProfile.tsx' && p.startsWith('src/pages/Organisation')
    );
    expect(retiredTracked).toEqual([]);
  });
});
