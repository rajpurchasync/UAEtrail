#!/usr/bin/env node
/** W77 — PeekBody split: wire→MapClient, card chrome stays CardChrome, peek UI/join→FlowChrome. */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const discoveryDir = join(root, 'src/discovery');

const DELETE = ['discoveryPortExplorePeekBody.ts'];

for (const name of DELETE) {
  const path = join(discoveryDir, name);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log('deleted', name);
  }
}

const targetPort = (content, rel) => {
  if (!content.includes('discoveryPortExplorePeekBody')) return null;
  if (/ExploreJoinOverlays/.test(content)) return null; /* list-local: explore/ui/ExploreJoinOverlays */
  if (/buildExploreMapItemFromActivity/.test(content)) return 'discoveryPortExploreMapClient';
  if (
    /ActivityPeekLinkedTransport|activityPeekHasLinkedTransportAffordance|ActivityPeekFooterIcon/.test(
      content
    )
  ) {
    return 'discoveryPortExploreFlowChrome';
  }
  return 'discoveryPortExploreCardChrome';
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx|mjs|json)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.endsWith('consolidate-discovery-ports-w77.mjs')) continue;
      const content = readFileSync(full, 'utf8');
      const to = targetPort(content, rel);
      if (!to) continue;
      const next = content.replaceAll('discoveryPortExplorePeekBody', to);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel, '→', to);
      }
    }
  }
};

walk(join(root, 'src'));
walk(join(root, 'scripts'));
console.log('done');