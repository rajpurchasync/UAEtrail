#!/usr/bin/env node
/** W56 — OptionalFilterWire split from OptionalFilters UI barrel. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const WIRE_PATHS = new Set([
  'src/list/browse/browseListUrlState.ts',
  'src/list/browse/browseListFilters.ts',
  'src/list/browse/buildListFeedCards.ts',
  'src/list/browse/browseListTripTopics.ts',
  'src/list/browse/listQuickFilterPills.ts',
  'src/list/browse/listBrowseFilterModal.ts',
  'src/places-discovery/catalog/places.ts',
  'src/activity-discovery/catalog/activities.ts',
]);

const REPLACEMENTS = [
  [
    "from '../../discovery/discoveryPortExploreOptionalFilters'",
    "from '../../discovery/discoveryPortExploreOptionalFilterWire'",
  ],
  [
    "from '../discovery/discoveryPortExploreOptionalFilters'",
    "from '../discovery/discoveryPortExploreOptionalFilterWire'",
  ],
];

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.includes('consolidate-discovery-ports-w56')) continue;
      if (rel === 'src/list/explorer/ListExplorerQuickFilters.tsx') continue;
      if (!WIRE_PATHS.has(rel) && !rel.startsWith('src/activity-discovery/') && !rel.startsWith('src/places-discovery/')) {
        if (!rel.includes('ListExplorerFilterPop') && !rel.includes('ListExplorerHeader') && !rel.includes('ListExplorer.tsx')) {
          continue;
        }
      }
      let next = readFileSync(full, 'utf8');
      if (next.includes('ExploreOptionalFilterRow')) continue;
      const content = next;
      for (const [from, to] of REPLACEMENTS) {
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
console.log('done');