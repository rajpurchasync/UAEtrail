#!/usr/bin/env node
/** W61 — Explorer + Experience → ListEmbed; PlaceDistance + VenueBrowseFacts → BrowseFacts. */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const discoveryDir = join(root, 'src/discovery');

const DELETE = [
  'discoveryPortListExplorer.ts',
  'discoveryPortListExperience.ts',
  'discoveryPortListPlaceDistance.ts',
  'discoveryPortListVenueBrowseFacts.ts',
];

const REPLACEMENTS = [
  ['discoveryPortListExplorer', 'discoveryPortListEmbed'],
  ['discoveryPortListExperience', 'discoveryPortListEmbed'],
  ['discoveryPortListPlaceDistance', 'discoveryPortListBrowseFacts'],
  ['discoveryPortListVenueBrowseFacts', 'discoveryPortListBrowseFacts'],
];

for (const name of DELETE) {
  const path = join(discoveryDir, name);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log('deleted', name);
  }
}

const rewrite = (content) => {
  let next = content;
  for (const [from, to] of REPLACEMENTS) next = next.replaceAll(from, to);
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
      if (rel.endsWith('consolidate-discovery-ports-w61.mjs')) continue;
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