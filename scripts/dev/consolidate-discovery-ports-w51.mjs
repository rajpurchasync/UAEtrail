#!/usr/bin/env node
/** W51 — slim Runtime: optional filters + activity date + browse/search copy off dedicated ports. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const REPLACEMENTS = [
  [
    "import type { ExploreActivityDatePreset, PlaceMapTopicKey } from '../../discovery/discoveryPortExploreRuntime'",
    "import type { ExploreActivityDatePreset } from '../../discovery/discoveryPortExploreActivityDate';\nimport type { PlaceMapTopicKey } from '../../discovery/discoveryPortExploreOptionalFilters'",
  ],
  [
    "import type { PlaceMapTopicKey, TripMapTopicKey } from '../../discovery/discoveryPortExploreRuntime'",
    "import type { PlaceMapTopicKey, TripMapTopicKey } from '../../discovery/discoveryPortExploreOptionalFilters'",
  ],
  [
    "import type { TripMapTopicKey } from '../../discovery/discoveryPortExploreRuntime'",
    "import type { TripMapTopicKey } from '../../discovery/discoveryPortExploreOptionalFilters'",
  ],
  [
    "import { hostedOutingSummariesByPlaceId } from '../../discovery/discoveryPortExploreRuntime'",
    "import { hostedOutingSummariesByPlaceId } from '../../discovery/discoveryPortExploreOptionalFilters'",
  ],
  [
    "import { EXPLORE_GUEST_MAP_PREVIEW_NOTICE, EXPLORE_SEARCH_OPEN_PLACEHOLDER } from '../../discovery/discoveryPortExploreRuntime'",
    "import { EXPLORE_GUEST_MAP_PREVIEW_NOTICE, EXPLORE_SEARCH_OPEN_PLACEHOLDER } from '../../discovery/discoveryPortExploreBrowse'",
  ],
  [
    "import type { ExploreSearchScopeKey } from '../../discovery/discoveryPortExploreRuntime'",
    "import type { ExploreSearchScopeKey } from '../../discovery/discoveryPortExploreSearch'",
  ],
  [
    "import { countExploreSearchScopes } from '../../discovery/discoveryPortExploreRuntime'",
    "import { countExploreSearchScopes } from '../../discovery/discoveryPortExploreSearch'",
  ],
  [
    "import { countExploreSearchScopes } from '../discovery/discoveryPortExploreRuntime'",
    "import { countExploreSearchScopes } from '../discovery/discoveryPortExploreSearch'",
  ],
];

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx|mjs)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.endsWith('consolidate-discovery-ports-w51.mjs')) continue;
      const content = readFileSync(full, 'utf8');
      let next = content;
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