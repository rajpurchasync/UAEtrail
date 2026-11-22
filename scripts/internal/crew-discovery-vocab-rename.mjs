/**
 * One-shot: align Find crew UI vocabulary (CrewDiscovery / CrewBrowse).
 * Archival — do not re-run on a clean tree. No compat shims are written (see crewDiscoveryNamingGuard).
 * Run from repo root: node scripts/internal/crew-discovery-vocab-rename.mjs
 */
import { existsSync, readFileSync, renameSync, readdirSync, statSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vitest']);

const TEXT_REPLACEMENTS = [
  // Copy constants + paths (path before constant prefix partial)
  ["from './explorePeopleBrowseCopy'", "from './exploreCrewsCopy'"],
  ["from '../content/explorePeopleBrowseCopy'", "from '../content/exploreCrewsCopy'"],
  ["from '../../content/explorePeopleBrowseCopy'", "from '../../content/exploreCrewsCopy'"],
  ["from '../../../content/explorePeopleBrowseCopy'", "from '../../../content/exploreCrewsCopy'"],
  ["@/content/explorePeopleBrowseCopy", "@/content/exploreCrewsCopy"],
  ['src/content/explorePeopleBrowseCopy.ts', 'src/content/exploreCrewsCopy.ts'],
  ['explorePeopleBrowseCopy.ts', 'exploreCrewsCopy.ts'],
  ['describe(\'explorePeopleBrowseCopy\'', "describe('exploreCrewsCopy'"],
  ['EXPLORE_PEOPLE_BROWSE_', 'EXPLORE_CREWS_'],
  ['explorePeopleBrowseDiscoverQuotaLine', 'exploreCrewDiscoveryDiscoverQuotaLine'],
  ['explorePeopleBrowseMapButtonAriaLabel', 'exploreCrewDiscoveryMapButtonAriaLabel'],
  ['explorePeopleBrowseGuestMapButtonAriaLabel', 'exploreCrewDiscoveryGuestMapButtonAriaLabel'],
  ['peopleBrowseQuotaPeriodLabel', 'crewBrowseQuotaPeriodLabel'],
  ['formatPeopleBrowseKindsList', 'formatCrewBrowseKindsList'],
  ['peopleBrowseFirstName', 'crewBrowseFirstName'],
  ['parsePeopleBrowseIsoDate', 'parseCrewBrowseIsoDate'],
  ['peopleBrowseAvailabilityDayLabels', 'crewBrowseAvailabilityDayLabels'],
  ['peopleBrowseAvailabilityWhenPhrase', 'crewBrowseAvailabilityWhenPhrase'],
  ['formatPeopleBrowseMinimalDate', 'formatCrewBrowseMinimalDate'],
  ['formatPeopleBrowseShortDate', 'formatCrewBrowseShortDate'],
  ['formatPeopleBrowseAvailabilitySlotLineMinimal', 'formatCrewBrowseAvailabilitySlotLineMinimal'],
  ['formatPeopleBrowseAvailabilitySlotLine', 'formatCrewBrowseAvailabilitySlotLine'],
  ['peopleBrowseAvailabilityKindSentence', 'crewBrowseAvailabilityKindSentence'],
  ['peopleBrowseAvailabilitySentence', 'crewBrowseAvailabilitySentence'],
  ['PeopleBrowseAvailabilitySchedule', 'CrewBrowseAvailabilitySchedule'],
  ['peopleBrowseAvailabilitySchedule', 'crewBrowseAvailabilitySchedule'],
  ['PEOPLE_BROWSE_AVAILABILITY_MAX_SCHEDULE_LINES', 'CREW_BROWSE_AVAILABILITY_MAX_SCHEDULE_LINES'],
  ['peopleBrowseAvailabilityDateLine', 'crewBrowseAvailabilityDateLine'],
  ['PeopleBrowseGoingCopyParts', 'CrewBrowseGoingCopyParts'],
  ['peopleBrowseGoingCopyParts', 'crewBrowseGoingCopyParts'],
  ['peopleBrowseGoingSentence', 'crewBrowseGoingSentence'],
  ['EXPLORE_PEOPLE_DISCOVERY_INTRO', 'EXPLORE_CREWS_INTRO'],
  // Panel / tab UI
  ['PeopleBrowsePanelProps', 'CrewsBrowsePanelProps'],
  ['PeopleBrowsePanelTabs', 'CrewBrowsePanelTabs'],
  ['PeopleBrowsePanel', 'CrewsBrowsePanel'],
  ['CrewDiscoveryPanelProps', 'CrewsBrowsePanelProps'],
  ['CrewDiscoveryPanel', 'CrewsBrowsePanel'],
  ['PeopleBrowseTabContentProps', 'CrewBrowseTabContentProps'],
  ['PeopleBrowseTabContent', 'CrewBrowseTabContent'],
  ['PeopleBrowseTabKey', 'CrewBrowseTabKey'],
  ['PeopleBrowseSearchField', 'CrewBrowseSearchField'],
  ['PeopleBrowseMemberRow', 'CrewBrowseMemberRow'],
  ['PeopleBrowseLookingList', 'CrewBrowseLookingList'],
  ['PeopleBrowseListEmpty', 'CrewBrowseListEmpty'],
  ['PeopleBrowseListLoading', 'CrewBrowseListLoading'],
  ['PeopleBrowseListError', 'CrewBrowseListError'],
  ['PEOPLE_BROWSE_LIST_STACK', 'CREW_BROWSE_LIST_STACK'],
  ['peopleBrowseListTheme', 'crewBrowseListTheme'],
  ['peopleBrowseAvailabilityKinds', 'crewBrowseAvailabilityKinds'],
  ['peopleBrowseAuthError', 'crewBrowseAuthError'],
  ["from './peopleBrowse'", "from './crewBrowse'"],
  ["from './peopleBrowse/", "from './crewBrowse/"],
  ['/panel/peopleBrowse/', '/panel/crewBrowse/'],
  ['/panel/PeopleBrowsePanel', '/panel/CrewsBrowsePanel'],
  ['/panel/CrewDiscoveryPanel', '/panel/CrewsBrowsePanel'],
  ['/panel/PeopleBrowsePanelTabs', '/panel/CrewBrowsePanelTabs'],
  // Explore state + handlers
  ['peopleBrowsePanelProps', 'crewDiscoveryPanelProps'],
  ['peopleBrowseMapChip', 'crewDiscoveryMapChip'],
  ['peopleBrowsePanelOpen', 'crewDiscoveryPanelOpen'],
  ['peopleLookingTabActive', 'crewLookingTabActive'],
  ['openPeopleBrowsePanel', 'openCrewsBrowsePanel'],
  ['closePeopleBrowsePanel', 'closeCrewsBrowsePanel'],
  ['openCrewDiscoveryPanel', 'openCrewsBrowsePanel'],
  ['closeCrewDiscoveryPanel', 'closeCrewsBrowsePanel'],
  ['peopleBrowseOpen', 'crewsBrowseOpen'],
  ['crewDiscoveryOpen', 'crewsBrowseOpen'],
  ['setPeopleBrowseOpen', 'setCrewsBrowseOpen'],
  ['setCrewDiscoveryOpen', 'setCrewsBrowseOpen'],
  ['applyPeopleBrowseTab', 'applyCrewBrowseTab'],
  ['useExplorePeopleBrowseBundle', 'useCrewDiscoveryBrowseBundle'],
  ['useExploreCrewDiscoveryBrowseBundle', 'useCrewDiscoveryBrowseBundle'],
  ['usePeopleDiscoveryBrowseBundle', 'useCrewDiscoveryBrowseBundle'],
  ['isPeopleBrowseListView', 'isCrewsBrowseListView'],
  ['isCrewDiscoveryListView', 'isCrewsBrowseListView'],
  ['clampGuestPeopleBrowse', 'clampGuestCrewDiscovery'],
  ['parseExplorePeopleBrowseTab', 'parseExploreCrewBrowseTab'],
  ['mapInboundPeopleBrowseTabValue', 'mapInboundCrewBrowseTabValue'],
  ['peopleBrowseTabValue', 'crewBrowseTabValue'],
  ['serializedPeopleTab', 'serializedCrewTab'],
  ['peoplePanelActive', 'crewDiscoveryPanelActive'],
  ['_peopleBrowseTab', '_crewBrowseTabSegment'],
  ['setcrewBrowseTab', 'setCrewBrowseTab'],
  // Wire read helper stays on peopleListBrowseUrl; fix typo import
  ['type crewBrowseTab,', 'type CrewBrowseTab,'],
  ['type crewBrowseTab }', 'type CrewBrowseTab }'],
  // Docs strings in comments
  ['crew-discovery/panel/peopleBrowse', 'crew-discovery/panel/crewBrowse'],
  ['`peopleBrowse/PeopleBrowseTabContent`', '`crewBrowse/CrewBrowseTabContent`'],
  ['Map pill label **Find your crew** (see `explorePeopleBrowseCopy.ts`', 'Map pill label **Find your crew** (see `exploreCrewsCopy.ts`'],
  ['(`peopleBrowseOpen`', '(`crewDiscoveryOpen`'],
];

const FILE_RENAMES = [
  ['src/content/explorePeopleBrowseCopy.ts', 'src/content/exploreCrewsCopy.ts'],
  ['src/content/explorePeopleBrowseCopy.test.ts', 'src/content/exploreCrewsCopy.test.ts'],
  ['src/crew-discovery/panel/PeopleBrowsePanel.tsx', 'src/crew-discovery/panel/CrewsBrowsePanel.tsx'],
  ['src/crew-discovery/panel/CrewDiscoveryPanel.tsx', 'src/crew-discovery/panel/CrewsBrowsePanel.tsx'],
  ['src/crew-discovery/panel/PeopleBrowsePanelTabs.tsx', 'src/crew-discovery/panel/CrewBrowsePanelTabs.tsx'],
  ['src/crew-discovery/hooks/usePeopleDiscoveryBrowseBundle.ts', 'src/crew-discovery/hooks/useCrewDiscoveryBrowseBundle.ts'],
  // useCrewDiscoveryBrowseBundle lives in src/crew-discovery/hooks — no explore/shell re-export shim
  ['src/crew-discovery/panel/peopleBrowse', 'src/crew-discovery/panel/crewBrowse'],
];

const FILES_IN_CREWBROWSE = [
  ['PeopleBrowseTabContent.tsx', 'CrewBrowseTabContent.tsx'],
  ['PeopleBrowseSearchField.tsx', 'CrewBrowseSearchField.tsx'],
  ['PeopleBrowseMemberRow.tsx', 'CrewBrowseMemberRow.tsx'],
  ['PeopleBrowseLookingList.tsx', 'CrewBrowseLookingList.tsx'],
  ['PeopleBrowseListStates.tsx', 'CrewBrowseListStates.tsx'],
  ['peopleBrowseListTheme.ts', 'crewBrowseListTheme.ts'],
  ['peopleBrowseAvailabilityKinds.ts', 'crewBrowseAvailabilityKinds.ts'],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx|md|json|mjs)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

function applyReplacements(content) {
  let next = content;
  for (const [from, to] of TEXT_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

// 1) Rename directory peopleBrowse -> crewBrowse
const peopleBrowseDir = join(ROOT, 'src/crew-discovery/panel/peopleBrowse');
const crewBrowseDir = join(ROOT, 'src/crew-discovery/panel/crewBrowse');
if (existsSync(peopleBrowseDir) && !existsSync(crewBrowseDir)) {
  renameSync(peopleBrowseDir, crewBrowseDir);
}

for (const [oldName, newName] of FILES_IN_CREWBROWSE) {
  const from = join(crewBrowseDir, oldName);
  const to = join(crewBrowseDir, newName);
  if (existsSync(from)) renameSync(from, to);
}

for (const [fromRel, toRel] of FILE_RENAMES) {
  if (fromRel.endsWith('peopleBrowse')) continue;
  const from = join(ROOT, fromRel);
  const to = join(ROOT, toRel);
  if (existsSync(from) && !existsSync(to)) {
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
  }
}

// 2) Patch all text files under src, scripts (partial), docs
const roots = [join(ROOT, 'src'), join(ROOT, 'scripts'), join(ROOT, 'docs')];
for (const root of roots) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    if (file.includes('crew-discovery-vocab-rename.mjs')) continue;
    const rel = file.replace(/\\/g, '/');
    if (rel.includes('.vitest/')) continue;
    const before = readFileSync(file, 'utf8');
    const after = applyReplacements(before);
    if (after !== before) writeFileSync(file, after, 'utf8');
  }
}

// 3) Remove deprecated shims
for (const rel of ['src/crew-discovery/peopleBrowseTab.ts', 'src/crew-discovery/peopleBrowseTab.test.ts']) {
  const p = join(ROOT, rel);
  if (existsSync(p)) unlinkSync(p);
}

console.log('crew-discovery-vocab-rename: done (no copy/routing shims — canonical exploreCrewsCopy + exploreCrewsPath)');