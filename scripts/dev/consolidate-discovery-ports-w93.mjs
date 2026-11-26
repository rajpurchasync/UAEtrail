#!/usr/bin/env node
/** W93 — search copy constants on CatalogFilters; SearchRouting has no exploreBrowseTaxonomy. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const routing = readFileSync(join(root, 'src/discovery/discoveryPortExploreSearchRouting.ts'), 'utf8');
const catalog = readFileSync(join(root, 'src/discovery/discoveryPortExploreCatalogFilters.ts'), 'utf8');
if (/exploreBrowseTaxonomy/.test(routing)) {
  console.error('SearchRouting still imports exploreBrowseTaxonomy');
  process.exit(1);
}
if (!/EXPLORE_SEARCH_OPEN_PLACEHOLDER/.test(catalog)) {
  console.error('CatalogFilters missing search copy exports');
  process.exit(1);
}
console.log('W93 applied — search copy on CatalogFilters');