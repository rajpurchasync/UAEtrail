#!/usr/bin/env node
/** W94 — guest map preview copy in guestMapPreviewCopy; GuestWire off exploreBrowseTaxonomy. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const guestWire = readFileSync(join(root, 'src/discovery/discoveryPortExploreGuestWire.ts'), 'utf8');
const taxonomy = readFileSync(join(root, 'src/explore/exploreBrowseTaxonomy.ts'), 'utf8');
if (/exploreBrowseTaxonomy/.test(guestWire)) {
  console.error('GuestWire still imports exploreBrowseTaxonomy');
  process.exit(1);
}
if (/EXPLORE_GUEST_MAP_PREVIEW_MAX_MATCHES|EXPLORE_SEARCH_GUEST_PLACEHOLDER/.test(taxonomy)) {
  console.error('exploreBrowseTaxonomy still owns guest copy');
  process.exit(1);
}
console.log('W94 applied — guest preview copy module');