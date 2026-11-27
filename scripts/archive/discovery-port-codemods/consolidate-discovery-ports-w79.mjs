#!/usr/bin/env node
/** W79 — welcome wire on discoveryPortExploreGuestWire; Guest port UI-only. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const WIRE_SYMBOLS =
  /resolveWelcomeFinishExplorePath|POST_SIGNUP_EXPLORE_PATH|EXPLORE_WELCOME_FINISH_STATE|readExploreGuestMapPreviewDismissed|writeExploreGuestMapPreviewDismissed|shouldOpenExploreLocationPromptFromWelcome/;

const rewrite = (content, rel) => {
  if (!content.includes('discoveryPortExploreGuest')) return content;
  if (!WIRE_SYMBOLS.test(content)) return content;
  if (rel.includes('discoveryPortExploreGuest.ts') && !rel.includes('GuestWire')) return content;
  return content.replaceAll('discoveryPortExploreGuest', 'discoveryPortExploreGuestWire');
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.endsWith('consolidate-discovery-ports-w79.mjs')) continue;
      const content = readFileSync(full, 'utf8');
      const next = rewrite(content, rel);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
console.log('done — re-point UI imports from GuestWire back to Guest manually if needed');