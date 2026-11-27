#!/usr/bin/env node
/** W76 — CrewAvailability split: wire→MapClient, preview UI→FlowChrome. */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const discoveryDir = join(root, 'src/discovery');

const DELETE = ['discoveryPortExploreCrewAvailability.ts'];
const FLOW_CHROME_IMPORT = /AvailabilitySlotEditor|AvailabilityMatchPreview/;

for (const name of DELETE) {
  const path = join(discoveryDir, name);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log('deleted', name);
  }
}

const rewriteFile = (rel, content) => {
  if (!content.includes('discoveryPortExploreCrewAvailability')) return content;
  const to = FLOW_CHROME_IMPORT.test(rel)
    ? 'discoveryPortExploreFlowChrome'
    : 'discoveryPortExploreMapClient';
  return content.replaceAll('discoveryPortExploreCrewAvailability', to);
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx|mjs|json)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.endsWith('consolidate-discovery-ports-w76.mjs')) continue;
      const content = readFileSync(full, 'utf8');
      const next = rewriteFile(rel, content);
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