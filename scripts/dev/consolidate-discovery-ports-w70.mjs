#!/usr/bin/env node
/** W70 — GeoHub shell-only; hydration imports → BrowseHooks. Inventory guard ships in discoveryPortNamingGuard. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const geoPane = join(root, 'src/geo/GeoBrowsePane.tsx');
if (existsSync(geoPane)) {
  const content = readFileSync(geoPane, 'utf8');
  const next = content.replaceAll(
    'useBrowseGeoScopeHydration } from \'../discovery/discoveryPortListGeoHub\'',
    'useBrowseGeoScopeHydration } from \'../discovery/discoveryPortListBrowseHooks\''
  );
  if (next !== content) {
    writeFileSync(geoPane, next, 'utf8');
    console.log('updated GeoBrowsePane.tsx');
  }
}
console.log('done');