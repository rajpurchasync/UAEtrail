import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * UPL Host = person leading this outing. Organizer / Operator / Publishing workspace
 * are workspace titles — not outing CTAs. Do not use Host for console/Pro application.
 * Wire identifiers, `/host/*` routes, and API field names are allowed — see allowlists below.
 */
const SCAN_ROOTS = [
  join(process.cwd(), 'src/content'),
  join(process.cwd(), 'src/components/home'),
  join(process.cwd(), 'src/components/profile'),
  join(process.cwd(), 'src/components/plan'),
  join(process.cwd(), 'src/components/layout'),
  join(process.cwd(), 'src/components/ui'),
  join(process.cwd(), 'src/components/admin'),
  join(process.cwd(), 'src/pages'),
  join(process.cwd(), 'src/explore'),
  join(process.cwd(), 'src/list'),
  join(process.cwd(), 'src/plan'),
  join(process.cwd(), 'docs'),
];

const SKIP_DIR_NAMES = new Set(['host', 'node_modules']);

const SKIP_FILE_PREFIXES = [
  'src/pages/publishing/',
  'src/console/',
  'src/api/',
  'apps/',
];

const ALLOWLIST_FILES = new Set([
  'src/content/workspaceProductLanguageGuard.test.ts',
  'src/content/workspaceVocabulary.ts',
  'src/content/workspaceVocabulary.test.ts',
  'src/content/docCoherence.test.ts',
  'src/member/hostMemberGuard.test.ts',
  'src/config/systemCoherenceGuard.test.ts',
  'src/components/organisation-console/proProfileApplicationForm.ts',
  'src/components/seo/schemas.activity.test.ts',
]);

/** Lines containing these are wire/comments, not product copy. */
const LINE_ALLOW_SUBSTRINGS = [
  '/host',
  'become-host',
  'host-status',
  'HostStatus',
  'hostUserId',
  'hostName',
  'hostAvatar',
  'hostTiers',
  'hostGate',
  'host-status',
  'canAccessPublishingWorkspace',
  'isCommunityHost',
  'useHostStatus',
  'host_applications',
  'hostProfileType',
  'hostDisplayName',
  'hostDisplay',
  'host_only',
  'message_host',
  'plan_host',
  'showHost',
  'listHost',
  'hosted',
  'hosting',
  'HOST_',
  'HostActivity',
  'HostManage',
  'HostShell',
  'createHost',
  'fetchHost',
  'cancelHost',
  'updateHost',
  'registerHost',
  'resolveActivityHost',
  'viewerIsActivityHost',
  'hostMember',
  'hostCopy',
  'hostWizard',
  'BecomeHost',
  'hostBrandProfile',
  'inferHost',
  'localhost',
  'ghost',
  'wire:',
  'Wire ',
  'GET /me/host',
  'Host*',
  '/host/*',
  'retired',
  'LEGACY_',
  'Host approval required', // legacy DB line in shared-types tests only — not in this scan roots for packages
  '#### E — Host,', // experiment plan doc wire label in docCoherence
  'host management tool', // NORTHSTAR anti-pattern quote
  'HOST_CLEANUP',
  'host-member',
  'host console pages',
  'Organisation* host',
  'host console',
  'host/overview',
  'host roles',
  'host peek',
  'host chose', // test description
  'host profiles (use guide', // routing hygiene test title
  'host console and activity',
  'host_join_queue',
  'host console`',
  'admin hosts',
  "label: 'Publish an event',", // FAB menu only — wire intent remains `host`
];

const BANNED_LINE_PATTERNS: Array<{ pattern: RegExp; hint: string }> = [
  { pattern: /\bHost console\b/, hint: 'Use Workspace or organizer/operator workspace' },
  { pattern: /\bHost an activity\b/i, hint: 'Use Host an outing' },
  { pattern: /\bOrganize outing/, hint: 'Use Host an outing / Host outings (UPL Host = lead this outing)' },
  { pattern: /\bHosts & shops\b/, hint: 'Use Hosts & operators' },
  { pattern: /\bHosts & hosting\b/, hint: 'Use Hosts & operators' },
  { pattern: /\bBecome a host\b/i, hint: 'Use Pro membership / guide or agency setup' },
  { pattern: /\bHost application\b/, hint: 'Use Pro membership' },
  { pattern: /\bAll hosts\b/, hint: 'Use All publishers or publishing accounts' },
  { pattern: /\bSuspend host\b/i, hint: 'Use Suspend publishing account' },
  { pattern: /\bNo hosts found\b/i, hint: 'Use No publishing accounts found' },
  { pattern: /\bHost name\b/, hint: 'Use Display name or brand name' },
  { pattern: /\borganize your own\b/i, hint: 'Use host your own' },
  { pattern: /\bHost publishing console\b/i, hint: 'Use Publishing workspace' },
  { pattern: /\bHost = user\b/, hint: 'Use Publishing actor = user (wire doc)' },
  { pattern: /\bHost console \(`\/host/, hint: 'Use Publishing workspace (`/host' },
  { pattern: /\bMessage organizer\b/i, hint: 'Use Message host (UPL)' },
  { pattern: /\bMy organizer profile\b/i, hint: 'Use My host profile (UPL)' },
  { pattern: /\bmessage the organizer\b/i, hint: 'Use message the host (UPL)' },
  { pattern: /\bverified organizer\b/i, hint: 'Use verified host (UPL)' },
  { pattern: /\bWaiting for organizer\b/, hint: 'Use Waiting for host (UPL)' },
  { pattern: /\bOrganizer tools on Buddies\b/, hint: 'Use Host tools on Buddies (UPL)' },
  { pattern: /\bchat with organizers\b/i, hint: 'Use chat with hosts (UPL)' },
];

const collectFiles = (dir: string): string[] => {
  const rel = relative(process.cwd(), dir).replace(/\\/g, '/');
  if (!rel.startsWith('src') && !rel.startsWith('docs')) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry)) continue;
      files.push(...collectFiles(full));
    } else if (
      (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.md')) &&
      !entry.endsWith('.d.ts')
    ) {
      files.push(relative(process.cwd(), full).replace(/\\/g, '/'));
    }
  }
  return files;
};

const lineAllowed = (line: string): boolean =>
  LINE_ALLOW_SUBSTRINGS.some((sub) => line.includes(sub));

describe('workspaceProductLanguageGuard', () => {
  it('consumer copy and Tier-1 docs keep Host as outing UPL; Host is not workspace/console', () => {
    const violations: string[] = [];
    const files = SCAN_ROOTS.flatMap((root) => collectFiles(root));

    for (const file of files) {
      if (ALLOWLIST_FILES.has(file)) continue;
      if (SKIP_FILE_PREFIXES.some((prefix) => file.startsWith(prefix))) continue;
      if (file.startsWith('src/explore/') && file.includes('.test.')) continue;
      if (file.startsWith('docs/experiment/')) continue;
      if (file.startsWith('docs/archive/')) continue;

      const content = readFileSync(join(process.cwd(), file), 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (lineAllowed(line)) return;
        for (const { pattern, hint } of BANNED_LINE_PATTERNS) {
          if (pattern.test(line)) {
            violations.push(`${file}:${index + 1}: ${hint} — ${line.trim().slice(0, 100)}`);
            break;
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('hostCopy shim is removed — import workspaceVocabulary directly', () => {
    const shim = join(process.cwd(), 'src/host/hostCopy.ts');
    expect(() => readFileSync(shim, 'utf8')).toThrow();
  });
});
