/**
 * One-shot: Crews browse UI symbols (panel + explore URL state).
 * Archival — run only if tree still has CrewDiscoveryPanel / crewDiscoveryOpen.
 */
import { existsSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.git', 'dist', '.vitest']);

const REPLACEMENTS = [
  ['CrewDiscoveryPanelProps', 'CrewsBrowsePanelProps'],
  ['CrewDiscoveryPanel', 'CrewsBrowsePanel'],
  ['closeCrewDiscoveryPanel', 'closeCrewsBrowsePanel'],
  ['openCrewDiscoveryPanel', 'openCrewsBrowsePanel'],
  ['onOpenCrewDiscoveryPanel', 'onOpenCrewsBrowsePanel'],
  ['crewDiscoveryPanelProps', 'crewsBrowsePanelProps'],
  ['crewDiscoveryPanelOpen', 'crewsBrowsePanelOpen'],
  ['crewDiscoveryPanelActive', 'crewsBrowsePanelActive'],
  ['crewDiscoveryMapChip', 'crewsBrowseMapChip'],
  ['setCrewDiscoveryOpen', 'setCrewsBrowseOpen'],
  ['crewDiscoveryOpen', 'crewsBrowseOpen'],
  ['isCrewDiscoveryListView', 'isCrewsBrowseListView'],
  ['clampGuestCrewDiscovery', 'clampGuestCrewsBrowse'],
  ['peopleMap', 'crewsBrowseMap'],
  ['peopleBrowsePanelAvatars', 'crewsBrowseMapAvatars'],
  ['peopleBrowsePanelFriendCount', 'crewsBrowseMapFriendCount'],
  ['peopleBrowseGuest', 'crewsBrowseMapGuest'],
  ['peopleBrowsePossibleCrewCount', 'crewsBrowseMapCrewCount'],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP.has(name)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx|md|json|mjs)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const files = [
  ...walk(join(ROOT, 'src')),
  ...walk(join(ROOT, 'docs')),
  join(ROOT, 'scripts/governance/people-vocabulary-touchpoints.json'),
].filter((p) => existsSync(p));

for (const file of files) {
  if (file.includes('crews-browse-ui-rename.mjs')) continue;
  let content = readFileSync(file, 'utf8');
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== content) writeFileSync(file, next, 'utf8');
}

const fromPanel = join(ROOT, 'src/crew-discovery/panel/CrewDiscoveryPanel.tsx');
const toPanel = join(ROOT, 'src/crew-discovery/panel/CrewsBrowsePanel.tsx');
if (existsSync(fromPanel) && !existsSync(toPanel)) {
  renameSync(fromPanel, toPanel);
}

console.log('crews-browse-ui-rename: done');