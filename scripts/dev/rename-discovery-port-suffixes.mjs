#!/usr/bin/env node
/**
 * W36 — consumer-oriented discoveryPort* suffix renames + import rewrite.
 * Do not re-run on a clean tree (idempotent map only renames if source exists).
 */
import { existsSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const discoveryDir = join(root, 'src/discovery');

/** Old basename → new basename (under src/discovery). */
const RENAME_MAP = {
  'discoveryPortExploreDiscoveryCardDirections.ts': 'discoveryPortExploreCardChrome.ts',
  'discoveryPortExploreDiscoveryCardPresentation.ts': 'discoveryPortExploreCardChrome.ts',
  'discoveryPortExploreDiscoveryCardTypeIcon.ts': 'discoveryPortExploreCardChrome.ts',
  'discoveryPortExploreDiscoverBrowse.ts': 'discoveryPortExploreBrowsePosters.ts',
  'discoveryPortExploreMemberDiscoveryRow.ts': 'discoveryPortExploreAvailabilityRowPath.ts',
  'discoveryPortExploreGuestComposeResume.ts': 'discoveryPortExploreComposeGuest.ts',
  'discoveryPortExploreGuestComposeSignIn.ts': 'discoveryPortExploreComposeGuest.ts',
};

const MERGE_DELETE = [
  'discoveryPortExploreLinkRideshareOffer.ts',
  'discoveryPortExploreLinkRidesharePrefill.ts',
  'discoveryPortExploreLinkRideshareUi.ts',
  'discoveryPortExploreLinkedParentRideshareCopy.ts',
  'discoveryPortExploreEligibleRideshareParents.ts',
  'discoveryPortExploreLinkedRideshareExplore.ts',
];

const IMPORT_REPLACEMENTS = [
  ['discoveryPortExploreDiscoveryCardDirections', 'discoveryPortExploreCardChrome'],
  ['discoveryPortExploreDiscoveryCardPresentation', 'discoveryPortExploreCardChrome'],
  ['discoveryPortExploreDiscoveryCardTypeIcon', 'discoveryPortExploreCardChrome'],
  ['discoveryPortExploreDiscoverBrowse', 'discoveryPortExploreBrowsePosters'],
  ['discoveryPortExploreMemberDiscoveryRow', 'discoveryPortExploreAvailabilityRowPath'],
  ['discoveryPortExploreGuestComposeResume', 'discoveryPortExploreComposeGuest'],
  ['discoveryPortExploreGuestComposeSignIn', 'discoveryPortExploreComposeGuest'],
  ['discoveryPortExploreLinkRideshareOffer', 'discoveryPortExploreLinkRideshare'],
  ['discoveryPortExploreLinkRidesharePrefill', 'discoveryPortExploreLinkRideshare'],
  ['discoveryPortExploreLinkRideshareUi', 'discoveryPortExploreLinkRideshare'],
  ['discoveryPortExploreLinkedParentRideshareCopy', 'discoveryPortExploreLinkRideshare'],
  ['discoveryPortExploreEligibleRideshareParents', 'discoveryPortExploreLinkRideshare'],
  ['discoveryPortExploreLinkedRideshareExplore', 'discoveryPortExploreLinkRideshare'],
];

for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
  const oldPath = join(discoveryDir, oldName);
  const newPath = join(discoveryDir, newName);
  if (!existsSync(oldPath)) continue;
  if (existsSync(newPath)) {
    console.warn(`skip rename ${oldName} — ${newName} exists`);
    continue;
  }
  renameSync(oldPath, newPath);
  console.log(`${oldName} → ${newName}`);
}

for (const name of MERGE_DELETE) {
  const path = join(discoveryDir, name);
  if (existsSync(path)) {
    unlinkSync(path);
    console.log(`deleted merged ${name}`);
  }
}

const rewriteContent = (content) => {
  let next = content;
  for (const [from, to] of IMPORT_REPLACEMENTS) {
    next = next.replaceAll(from, to);
  }
  return next;
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx|mjs|json|mdc)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.endsWith('rename-discovery-port-suffixes.mjs')) continue;
      const content = readFileSync(full, 'utf8');
      const next = rewriteContent(content);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
walk(join(root, 'scripts'));
walk(join(root, '.cursor'));

console.log('done');