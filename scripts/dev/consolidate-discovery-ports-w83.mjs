#!/usr/bin/env node
/** W83 — guest preview copy on GuestWire; search placeholders on SearchRouting. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');

const guestRewrite = (content) => {
  if (!content.includes('EXPLORE_GUEST_MAP_PREVIEW')) return content;
  if (!content.includes('discoveryPortExploreBrowse')) return content;
  return content.replaceAll('discoveryPortExploreBrowse', 'discoveryPortExploreGuestWire');
};

const searchRewrite = (content) => {
  if (!/EXPLORE_SEARCH_(OPEN_PLACEHOLDER|PROMPT)/.test(content)) return content;
  if (!content.includes('discoveryPortExploreBrowse')) return content;
  let next = content;
  const hadBoth =
    content.includes('EXPLORE_SEARCH_OPEN_PLACEHOLDER') && content.includes('EXPLORE_SEARCH_PROMPT');
  if (hadBoth && content.includes('ExploreSearchScope')) {
    next = next.replace(
      /import \{([^}]*EXPLORE_SEARCH[^}]*ExploreSearchScope[^}]*)\} from ['"][^'"]*discoveryPortExploreBrowse['"];/s,
      (block) => {
        const types = block.match(/type ExploreSearchScope[^;]+;/)?.[0] ?? '';
        const typeImport = types
          ? `import { ${types.replace(/^type /, 'type ')} } from '../../discovery/discoveryPortExploreBrowse';\n`
          : '';
        return `${typeImport}import {\n  EXPLORE_SEARCH_OPEN_PLACEHOLDER,\n  EXPLORE_SEARCH_PROMPT,\n} from '../../discovery/discoveryPortExploreSearchRouting';`;
      }
    );
  } else {
    next = searchRewriteSimple(next);
  }
  return next;
};

const searchRewriteSimple = (content) =>
  content.replaceAll('discoveryPortExploreBrowse', 'discoveryPortExploreSearchRouting');

const walk = (dir) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const rel = relative(root, full).replace(/\\/g, '/');
      if (rel.endsWith('consolidate-discovery-ports-w83.mjs')) continue;
      let content = readFileSync(full, 'utf8');
      let next = guestRewrite(content);
      next = searchRewrite(next);
      if (next !== content) {
        writeFileSync(full, next, 'utf8');
        console.log('updated', rel);
      }
    }
  }
};

walk(join(root, 'src'));
console.log('done');