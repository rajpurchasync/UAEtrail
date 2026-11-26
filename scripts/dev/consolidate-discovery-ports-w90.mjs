#!/usr/bin/env node
/** W90 — discoveryPortExploreBrowse.ts retired; URL type → BrowseUrl, hooks → BrowseHooks. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const legacy = join(root, 'src/discovery/discoveryPortExploreBrowse.ts');
const browseUrl = join(root, 'src/discovery/discoveryPortExploreBrowseUrl.ts');
if (existsSync(legacy)) {
  console.error('Remove discoveryPortExploreBrowse.ts first');
  process.exit(1);
}
if (!existsSync(browseUrl)) {
  console.error('Missing discoveryPortExploreBrowseUrl.ts');
  process.exit(1);
}
console.log('W90 applied — Browse retired; BrowseUrl + BrowseHooks');