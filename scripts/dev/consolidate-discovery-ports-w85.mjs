#!/usr/bin/env node
/** W85 — list URL wire via SearchRouting; crew community card off routingCatalog. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const urlState = join(root, 'src/list/browse/useListDiscoveryUrlState.ts');
let body = readFileSync(urlState, 'utf8');
if (body.includes('discoveryPortExploreSearch')) {
  body = body.replaceAll('discoveryPortExploreSearch', 'discoveryPortExploreSearchRouting');
  writeFileSync(urlState, body, 'utf8');
  console.log('updated useListDiscoveryUrlState');
}

const card = join(root, 'src/list/explorer/FindCrewCommunityCard.tsx');
body = readFileSync(card, 'utf8');
if (body.includes('routingCatalog')) {
  body = body.replace(
    "import { communityClubPath, joinAuthPath } from '@/config/routingCatalog';",
    "import { joinAuthPath } from '@/config/platform';\nimport { communityClubPath } from '@/config/surfacePaths';"
  );
  writeFileSync(card, body, 'utf8');
  console.log('updated FindCrewCommunityCard');
}
console.log('done');