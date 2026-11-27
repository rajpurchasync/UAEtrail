#!/usr/bin/env node
/** W78 — mobileBackNav decycled; people full-screen return path on Routing (not Browse). */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const rewrite = (content) => {
  let next = content;
  next = next.replaceAll(
    "from '../discovery/discoveryPortExploreBrowse'",
    "from '../discovery/discoveryPortExploreRouting'"
  );
  next = next.replaceAll(
    "from '../../discovery/discoveryPortExploreBrowse'",
    "from '../../discovery/discoveryPortExploreRouting'"
  );
  next = next.replaceAll(
    "from '@/discovery/discoveryPortExploreBrowse'",
    "from '@/discovery/discoveryPortExploreRouting'"
  );
  if (next.includes('exploreMapPathAfterPeopleFullScreen') && next.includes('routingCatalog')) {
    next = next.replace(
      /import \{([^}]*EXPLORE_MAP_PATH[^}]*)\} from ['"]\.\.\/config\/routingCatalog['"];/,
      "import { EXPLORE_MAP_PATH } from '../config/platform';\nimport { MESSAGES_PATH, PLAN_PATH, PROFILE_PATH } from '../config/surfacePaths';"
    );
  }
  return next;
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx|mjs)$/.test(ent.name)) {
      const rel = relative(root, full);
      if (rel.endsWith('consolidate-discovery-ports-w78.mjs')) continue;
      if (!readFileSync(full, 'utf8').includes('exploreMapPathAfterPeopleFullScreen')) continue;
      const content = readFileSync(full, 'utf8');
      const next = rewrite(content);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

if (!existsSync(join(root, 'src/utils/mobileBackNav.ts'))) {
  console.error('mobileBackNav missing — run W78 manually');
  process.exit(1);
}
walk(join(root, 'src'));
console.log('done');