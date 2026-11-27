#!/usr/bin/env node
/** W81 — map item kind wire on MapPin; list search feed uses platform path. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const KIND = /isPlacesMapItem|isShopListItem|mapItemMatchesShopsPill/;

const rewrite = (content) => {
  let next = content;
  if (!KIND.test(content)) return content;
  if (!content.includes('discoveryPortExploreBrowse')) return content;
  next = next.replaceAll('discoveryPortExploreBrowse', 'discoveryPortExploreMapPin');
  return next;
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.endsWith('consolidate-discovery-ports-w81.mjs')) continue;
      const content = readFileSync(full, 'utf8');
      const next = rewrite(content);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

const feed = join(root, 'src/list/shell/useListDiscoveryExploreSearchFeedModel.ts');
if (readFileSync(feed, 'utf8').includes("from '../../config/routingCatalog'")) {
  const next = readFileSync(feed, 'utf8').replace(
    "import { EXPLORE_MAP_PATH } from '../../config/routingCatalog';",
    "import { EXPLORE_MAP_PATH } from '../../config/platform';"
  );
  writeFileSync(feed, next, 'utf8');
  console.log('updated', 'src/list/shell/useListDiscoveryExploreSearchFeedModel.ts');
}

walk(join(root, 'src/list'));
walk(join(root, 'src/places-discovery'));
console.log('done');