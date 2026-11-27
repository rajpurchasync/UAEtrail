#!/usr/bin/env node
/** W84 — Browse hooks-only; scope types SearchRouting; pills CatalogFilters; rail MapChrome. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const rules = [
  {
    test: /ExploreSearchScopeCounts|ExploreSearchScopeKey/,
    from: 'discoveryPortExploreBrowse',
    to: 'discoveryPortExploreSearchRouting',
  },
  {
    test: /parseExploreMapFilterPillsParam|serializeExploreMapFilterPillsParam|ExploreMapFilterPillKey/,
    from: 'discoveryPortExploreBrowse',
    to: 'discoveryPortExploreCatalogFilters',
  },
  {
    test: /EXPLORE_DESKTOP_BROWSE_RAIL_SCROLL_CLASS/,
    from: 'discoveryPortExploreBrowse',
    to: 'discoveryPortExploreMapChrome',
  },
];

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.endsWith('consolidate-discovery-ports-w84.mjs')) continue;
      if (rel.includes('discoveryPortExploreBrowse.ts')) continue;
      let content = readFileSync(full, 'utf8');
      let next = content;
      for (const rule of rules) {
        if (!rule.test.test(content)) continue;
        if (!content.includes(rule.from)) continue;
        next = next.replaceAll(rule.from, rule.to);
      }
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
const topics = join(root, 'src/list/browse/listVenuePlaceTopics.ts');
let topicsBody = readFileSync(topics, 'utf8');
if (topicsBody.includes('config/routingCatalog')) {
  topicsBody = topicsBody.replace(
    "import type { MapFilterKey } from '../../config/routingCatalog';",
    "import type { MapFilterKey } from '../../discovery/discoveryPortExploreRouting';"
  );
  writeFileSync(topics, topicsBody, 'utf8');
  console.log('updated listVenuePlaceTopics');
}
console.log('done');