#!/usr/bin/env node
/** W80 — isDiscoverBrowseRoute on Routing; config chrome off Browse. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const TARGET_DIRS = ['src/config', 'src/components/layout'];

const rewrite = (content) => {
  let next = content;
  if (!content.includes('isDiscoverBrowseRoute')) return content;
  if (!content.includes('discoveryPortExploreBrowse')) return content;
  next = next.replaceAll('discoveryPortExploreBrowse', 'discoveryPortExploreRouting');
  return next;
};

for (const dir of TARGET_DIRS) {
  const walk = (base) => {
    for (const ent of readdirSync(base, { withFileTypes: true })) {
      const full = join(base, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(ent.name)) {
        const rel = relative(root, full).replace(/\\/g, '/');
        const content = readFileSync(full, 'utf8');
        const next = rewrite(content);
        if (next !== content) {
          writeFileSync(full, next, 'utf8');
          console.log('updated', rel);
        }
      }
    }
  };
  walk(join(root, dir));
}
console.log('done');