#!/usr/bin/env node
/** W91 — search scope taxonomy off SearchRouting; CatalogFilters owns scope types. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const routing = readFileSync(join(root, 'src/discovery/discoveryPortExploreSearchRouting.ts'), 'utf8');
const catalog = readFileSync(join(root, 'src/discovery/discoveryPortExploreCatalogFilters.ts'), 'utf8');
if (/ExploreSearchScopeCounts/.test(routing)) {
  console.error('SearchRouting still exports scope taxonomy');
  process.exit(1);
}
if (!/ExploreSearchScopeCounts/.test(catalog)) {
  console.error('CatalogFilters missing scope taxonomy exports');
  process.exit(1);
}
console.log('W91 applied — scope taxonomy on CatalogFilters');