#!/usr/bin/env node
/** W67 — BrowseFacts → Peek; dedupe CommunityDiscoverBrowseList on FindCrew. */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const discoveryDir = join(root, 'src/discovery');

const DELETE = ['discoveryPortListBrowseFacts.ts'];

const REPLACEMENTS = [
  ['discoveryPortListBrowseFacts', 'discoveryPortListPeek'],
  [
    "from '@/discovery/discoveryPortListFindCrew'",
    "from '@/discovery/discoveryPortListEmbed'",
  ],
];

const CREW_EMBED_FILES = [
  'src/crew-discovery/panel/crewBrowse/CrewBrowseRecommendedBody.tsx',
];

for (const name of DELETE) {
  const path = join(discoveryDir, name);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log('deleted', name);
  }
}

for (const rel of CREW_EMBED_FILES) {
  const full = join(root, rel);
  if (!existsSync(full)) continue;
  let content = readFileSync(full, 'utf8');
  if (
    content.includes('CommunityDiscoverBrowseList') &&
    content.includes('discoveryPortListFindCrew')
  ) {
    content = content.replace(
      /import \{ CommunityDiscoverBrowseList \} from '@\/discovery\/discoveryPortListFindCrew';/,
      "import { CommunityDiscoverBrowseList } from '@/discovery/discoveryPortListEmbed';"
    );
    writeFileSync(full, content, 'utf8');
    console.log('updated', rel);
  }
}

const rewrite = (content) => {
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    if (from.startsWith('from ')) continue;
    next = next.replaceAll(from, to);
  }
  return next;
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx|mjs|json)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.endsWith('consolidate-discovery-ports-w67.mjs')) continue;
      if (CREW_EMBED_FILES.includes(rel.replace(/\\/g, '/'))) continue;
      const content = readFileSync(full, 'utf8');
      const next = rewrite(content);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
walk(join(root, 'scripts'));
console.log('done');