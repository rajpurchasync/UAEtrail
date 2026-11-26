#!/usr/bin/env node
/** W53 — browse map pills + cover/peek labels + search query match off Runtime. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const REPLACEMENTS = [
  [
    "import { exploreItemMatchesQuery } from '../../discovery/discoveryPortExploreRuntime'",
    "import { exploreItemMatchesQuery } from '../../discovery/discoveryPortExploreSearchRouting'",
  ],
  [
    "import { resolveExploreCoverImage } from './discoveryPortExploreRuntime'",
    "import { resolveExploreCoverImage } from './discoveryPortExploreCardChrome'",
  ],
  [
    "import { resolveExploreCoverImage } from '../../discovery/discoveryPortExploreRuntime'",
    "import { resolveExploreCoverImage } from '../../discovery/discoveryPortExploreCardChrome'",
  ],
  [
    `import {
  parseExploreMapFilterPillsParam,
  serializeExploreMapFilterPillsParam,
  type ExploreMapFilterPillKey,
} from '../../discovery/discoveryPortExploreRuntime'`,
    `import {
  parseExploreMapFilterPillsParam,
  serializeExploreMapFilterPillsParam,
  type ExploreMapFilterPillKey,
} from '../../discovery/discoveryPortExploreBrowse'`,
  ],
  [
    `import {
  activityMapPeekActionLabel,
  type ActivityMapPeekActionLabelContext,
} from '../../discovery/discoveryPortExploreRuntime'`,
    `import {
  activityMapPeekActionLabel,
  type ActivityMapPeekActionLabelContext,
} from '../../discovery/discoveryPortExploreCardChrome'`,
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
      if (rel.includes('consolidate-discovery-ports-w53')) continue;
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