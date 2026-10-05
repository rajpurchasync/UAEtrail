import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_ROOT = join(process.cwd(), 'src');

/** Legacy `api.*` symbols — use domain names from `src/api/domains/*` via `api`. */
const BANNED_CALLS: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /\bapi\.getTenantProfile\b/, hint: 'Use api.getOrganisationProfile' },
  { pattern: /\bapi\.getUserPublicProfile\b/, hint: 'Use api.getPersonPublicProfile' },
  { pattern: /\bapi\.getHostSubmittedPlaces\b/, hint: 'Use api.getOrganisationSubmittedPlaces' },
  { pattern: /\bapi\.getHostSubmittedLocations\b/, hint: 'Use api.getOrganisationSubmittedPlaces' },
  {
    pattern: /\bapi\.(create|publish|list|update|cancel|duplicate)OrganisationActivity\b/,
    hint: 'Use *HostActivity (routes under /host/activities)',
  },
  {
    pattern: /\bapi\.(getOrganisationJoinRequests|decideOrganisationJoinRequest)\b/,
    hint: 'Use getHostActivityJoinRequests / decideHostActivityJoinRequest',
  },
  { pattern: /\buseOrganisationGate\b/, hint: 'Use useHostStatus' },
  { pattern: /\buseOrganisationHubData\b/, hint: 'Use useConsoleHubData' },
  { pattern: /\bOrganisationHubSections\b/, hint: 'Use ConsoleHubSections from src/console' },
  { pattern: /\bapi\.listActivities\b/, hint: 'Use api.listHostActivities (host console tenant scope)' },
  { pattern: /\bapi\.(getHostRequests|decideHostRequest|getHostTeam)\b/, hint: 'Use getHostActivityJoinRequests / getOrganisationTeam' },
  { pattern: /\bapi\.(getMyHostStatus|getMyHostApplication|submitHostApplication)\b/, hint: 'Use getMyOrganisation* / submitOrganisationApplication' },
  { pattern: /\bapi\.fulfillParticipantIntent\b/, hint: 'Use api.linkParticipantIntentToActivity (demand poster)' },
  { pattern: /\bapi\.updateHostDetails\b/, hint: 'Use api.updateOrganisationDetails' },
  { pattern: /\bapi\.getAdminApplications\b/, hint: 'Use api.getAdminOrganisationApplications' },
  { pattern: /\bapi\.getAdminUsers\b/, hint: 'Use api.getAdminMembers' },
  { pattern: /\bapi\.getAdminUserDetail\b/, hint: 'Use api.getAdminMemberDetail' },
  { pattern: /\bapi\.updateAdminUserStatus\b/, hint: 'Use api.updateAdminMemberStatus' },
  { pattern: /\bapi\.getPublicLocations\b/, hint: 'Use api.getPublicPlaces' },
  { pattern: /\bapi\.getPublicLocationDetail\b/, hint: 'Use api.getPublicPlaceDetail' },
  { pattern: /\bapi\.getReviews\s*\(\s*['"]tenant['"]/, hint: 'Use api.getOrganisationReviews' },
  { pattern: /\bapi\.createReview\s*\(/, hint: 'Use api.createPlaceReview or api.createOrganisationReview' },
  { pattern: /\bapi\.getMerchantProfileById\b/, hint: 'Use api.getShopOrganisationProfileById' },
  { pattern: /\bapi\.(getMyRewards|getRewardCatalog|getRewardStats|getRewardsLeaderboard)\b/, hint: 'Trail Points wallet removed — use getMemberBadges' },
  { pattern: /\bapi\.getMerchantProducts\b/, hint: 'Use api.getShopOrganisationProducts' },
  { pattern: /\bapi\.updateMerchantProduct\b/, hint: 'Use api.updateShopOrganisationProduct' },
  { pattern: /\bapi\.deleteMerchantProduct\b/, hint: 'Use api.deleteShopOrganisationProduct' },
  { pattern: /from ['"][^'"]*\/api\/services['"]/, hint: 'Import from api/index' },
  { pattern: /from ['"].*legacyApi/, hint: 'legacyApi removed — use src/api/domains/* canonical methods' },
  { pattern: /\.\.\.legacyApi\b/, hint: 'Do not spread legacyApi on api' },
];

const SKIP_PREFIXES = ['src/api/', 'src/api\\'];

const LEGACY_SYMBOL_ALLOW = new Set([
  'src/console/ConsoleHubSections.tsx',
  'src/components/account/OrganisationHubSections.tsx',
  'src/components/account/index.ts',
  'src/components/organisation-console/OrganisationConsoleShell.tsx',
  'src/components/organisation-console/OrganisationJoinRequestCard.tsx',
  'src/components/organisation-console/OrganisationJoinRequestDeclineDialog.tsx',
  'src/components/organisation-console/OrganisationRatingChip.tsx',
  'src/member/organisationNamingGuard.test.ts',
]);

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

describe('apiLegacyGuard', () => {
  it('app code does not call deprecated legacy api facade symbols', () => {
    const files = collectSourceFiles(SCAN_ROOT).filter(
      (file) => !SKIP_PREFIXES.some((prefix) => file.startsWith(prefix))
    );
    const violations: string[] = [];

    for (const file of files) {
      if (LEGACY_SYMBOL_ALLOW.has(file)) continue;
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const { pattern, hint } of BANNED_CALLS) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${hint}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
