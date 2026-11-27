#!/usr/bin/env node
/** W89 — destination hooks → BrowseHooks; Browse keeps useExploreBrowseUrlState type only. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const HOOK = /useExplorePublishedDestinations(Query)?/;
const replacements = [
  ["from '@/discovery/discoveryPortExploreBrowse'", "from '@/discovery/discoveryPortExploreBrowseHooks'"],
  ["from '../discovery/discoveryPortExploreBrowse'", "from '../discovery/discoveryPortExploreBrowseHooks'"],
  ["from '../../discovery/discoveryPortExploreBrowse'", "from '../../discovery/discoveryPortExploreBrowseHooks'"],
];

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.includes('discoveryPortExploreBrowse')) continue;
      if (rel.includes('useCrewDiscoveryBrowseBundle')) continue;
      let content = readFileSync(full, 'utf8');
      if (!HOOK.test(content) || !content.includes('discoveryPortExploreBrowse')) continue;
      let next = content;
      for (const [from, to] of replacements) {
        next = next.replaceAll(from, to);
      }
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
console.log('done — crew browse bundle keeps Browse for URL state type');