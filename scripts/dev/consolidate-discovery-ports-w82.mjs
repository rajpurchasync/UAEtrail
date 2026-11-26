#!/usr/bin/env node
/** W82 — destination slug on CatalogFilters; list feed activity paths from shared-types. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const slugRewrite = (content) => {
  if (!content.includes('parseExploreDestinationSlug')) return content;
  if (!content.includes('discoveryPortExploreBrowse')) return content;
  return content.replaceAll('discoveryPortExploreBrowse', 'discoveryPortExploreCatalogFilters');
};

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.endsWith('consolidate-discovery-ports-w82.mjs')) continue;
      const content = readFileSync(full, 'utf8');
      let next = slugRewrite(content);
      if (rel === 'src/list/browse/ListFeedActionsProvider.tsx' && next.includes("from '../../config/routingCatalog'")) {
        next = next.replace(
          /import \{ activityDetailPath \} from '\.\.\/\.\.\/config\/routingCatalog';\n/,
          ''
        );
        if (!next.includes('activityDetailPath') && content.includes('activityDetailPath')) {
          next = next.replace(
            /from '@uaetrail\/shared-types';/,
            "from '@uaetrail/shared-types';\nimport { activityDetailPath } from '@uaetrail/shared-types';"
          );
        }
        next = next.replace(
          "import type { ActivityDTO, ActivityMapPeekActionId, UserRole } from '@uaetrail/shared-types';",
          "import { activityDetailPath, type ActivityDTO, type ActivityMapPeekActionId, type UserRole } from '@uaetrail/shared-types';"
        );
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