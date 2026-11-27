#!/usr/bin/env node
/** W52 — pinKind + parseExplorePanel off Runtime → MapClient / Routing. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const REPLACEMENTS = [
  [
    `import {
  parseExplorePanel,
  parseExplorePinKindFilter,
  serializeExplorePinKindFilter,
  type ExplorePinKindFilter,
} from '../../discovery/discoveryPortExploreRuntime'`,
    `import {
  parseExplorePinKindFilter,
  serializeExplorePinKindFilter,
  type ExplorePinKindFilter,
} from '../../discovery/discoveryPortExploreMapClient';
import { parseExplorePanel } from '../../discovery/discoveryPortExploreRouting'`,
  ],
];

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.includes('consolidate-discovery-ports-w52')) continue;
      let next = readFileSync(full, 'utf8');
      let content = next;
      for (const [from, to] of REPLACEMENTS) {
        next = next.replace(from, to);
      }
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
console.log('done');