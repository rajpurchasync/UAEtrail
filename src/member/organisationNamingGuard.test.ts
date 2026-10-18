import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_ROOT = join(ROOT, 'src');

/** Retired host-console / form-modal stack — must not exist on disk (use `pages/operator/*`, Explore Organize). */
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
];

const DEPRECATED_HOST_PAGE_IMPORTS = RETIRED_PATHS.filter((p) => p.startsWith('src/pages/Organisation'));

/** `pages/Organisation*.tsx` allowed — public tenant storefront, not host console. */
const ALLOWED_ORGANISATION_PAGE_FILES = new Set(['OrganisationProfile.tsx']);

const REQUIRED_HOST_CONSOLE_PAGES = [
  'src/pages/operator/Overview.tsx',
  'src/pages/operator/Activities.tsx',
  'src/pages/operator/JoinRequests.tsx',
  'src/pages/operator/Team.tsx',
  'src/pages/operator/Places.tsx',
  'src/pages/operator/History.tsx',
  'src/pages/operator/PublicProfileEdit.tsx',
  'src/pages/operator/Manage.tsx',
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

  it('publishing console route pages live under src/pages/operator/', () => {
    const missing = REQUIRED_HOST_CONSOLE_PAGES.filter((rel) => !existsSync(join(ROOT, rel)));
    expect(missing).toEqual([]);
  });

  it('only OrganisationProfile remains under pages/ for Organisation* shell names', () => {
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
          violations.push(`${file}: use src/pages/operator/* instead of ${legacy}`);
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
      (p) => p !== 'src/pages/OrganisationProfile.tsx' && p.startsWith('src/pages/Organisation')
    );
    expect(retiredTracked).toEqual([]);
  });
});
