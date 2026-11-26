#!/usr/bin/env node
/** W54 — place-kind + catalog/optional filter helpers off Runtime; search scope wire → SearchRouting. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const REPLACEMENTS = [
  [
    "import { mapItemMatchesShopsPill } from '../../discovery/discoveryPortExploreRuntime'",
    "import { mapItemMatchesShopsPill } from '../../discovery/discoveryPortExploreBrowse'",
  ],
  [
    `import {
  isPlacesMapItem,
  isShopListItem,
} from '../../discovery/discoveryPortExploreRuntime'`,
    `import { isPlacesMapItem, isShopListItem } from '../../discovery/discoveryPortExploreBrowse'`,
  ],
  [
    "import { countExploreSearchScopes } from '../../discovery/discoveryPortExploreSearch'",
    "import { countExploreSearchScopes } from '../../discovery/discoveryPortExploreSearchRouting'",
  ],
  [
    "import { countExploreSearchScopes } from '../discovery/discoveryPortExploreSearch'",
    "import { countExploreSearchScopes } from '../discovery/discoveryPortExploreSearchRouting'",
  ],
  [
    "import type { ExploreSearchScopeKey } from '../../discovery/discoveryPortExploreSearch'",
    "import type { ExploreSearchScopeKey } from '../../discovery/discoveryPortExploreSearchRouting'",
  ],
];

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.includes('consolidate-discovery-ports-w54')) continue;
      let next = readFileSync(full, 'utf8');
      const content = next;
      for (const [from, to] of REPLACEMENTS) {
        next = next.replace(from, to);
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