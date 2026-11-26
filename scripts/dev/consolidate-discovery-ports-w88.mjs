#!/usr/bin/env node
/** W88 — discoveryPortExploreSearch is UI-only; strip SearchRouting re-exports (hand-ship on clean tree). */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const searchPort = join(root, 'src/discovery/discoveryPortExploreSearch.ts');
const content = readFileSync(searchPort, 'utf8');
if (content.includes('discoveryPortExploreSearchRouting')) {
  console.error('Search facade still re-exports SearchRouting — remove manually');
  process.exit(1);
}
if (!content.includes('ExploreSearchScopeHints')) {
  console.error('Search facade missing UI exports');
  process.exit(1);
}
console.log('W88 already applied — discoveryPortExploreSearch.ts is UI-only');