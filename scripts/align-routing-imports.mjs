#!/usr/bin/env node
/**
 * One-shot / repeatable: move path constant imports to config/routingCatalog.
 * MAP_CONFIG and layout helpers stay on config/platform.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

const CATALOG_SYMBOLS = new Set([
  'EXPLORE_MAP_PATH',
  'PARTICIPANT_JOIN_REDIRECT',
  'joinAuthPath',
  'ADMIN_PLACES_PATH',
  'HOST_PLACES_PATH',
  'ORGANISATION_PUBLIC_PATH_PREFIX',
  'OPERATOR_PUBLIC_PATH_PREFIX',
  'PRO_MEMBERSHIP_PATH',
  'LEGACY_BECOME_HOST_PATH',
  'proMembershipPath',
  'TRIPS_PATH',
  'ACTIVITIES_PATH',
  'HOST_CONSOLE_LINKS',
  'ADMIN_LINKS',
  'placeDetailPath',
  'activityDetailPath',
  'organisationProfilePath',
  'memberProfilePath',
  'shopPublicPath',
  'resolveEntityPath',
  'resolveOrganisationProfilePath',
  'parseEntityRefFromPathname',
  'exploreDemandMapItemPath',
  'EXPLORE_SHOPS_PATH',
  'EXPLORE_SHOPS_LIST_PATH',
  'explorePath',
  'exploreSavedPinPath',
  'legacyCreateParamToOrganizePath',
  'tripsPlansPath',
  'tripsCompletedPath',
  'tripsMapPath',
  'tripsLegacyJoinedTabPath',
  'tripsLegacyUpcomingSegmentPath',
  'ExplorePanel',
  'MapFilterKey',
  'EntityRef',
  'EntityKind',
  'PlaceVenueKind',
  'DOMAIN_GLOSSARY',
]);

const SKIP_DIRS = new Set(['api', 'node_modules']);
const SKIP_FILES = new Set([
  'src/config/routingCatalog.ts',
  'src/config/platform.ts',
  'src/config/memberRoutes.ts',
  'src/constants/index.ts',
  'src/explore/routing.ts',
]);

const collectFiles = (dir, acc = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    if (SKIP_DIRS.has(entry)) continue;
    const st = statSync(full);
    if (st.isDirectory()) collectFiles(full, acc);
    else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts'))
      acc.push(rel);
  }
  return acc;
};

const importRe =
  /^import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"](\.\.?\/)+config\/(platform|memberRoutes)['"];?\s*$/gm;

const parseSpec = (spec) =>
  spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(?:type\s+)?(\w+)(?:\s+as\s+(\w+))?$/);
      return m ? { name: m[1], alias: m[2], isType: part.startsWith('type ') } : null;
    })
    .filter(Boolean);

const relCatalogImport = (file) => {
  const depth = file.split('/').length - 2; // src/foo -> 1
  return `${'../'.repeat(depth)}config/routingCatalog`;
};

let changed = 0;

for (const file of collectFiles(SRC)) {
  if (SKIP_FILES.has(file)) continue;
  const abs = join(ROOT, file);
  let content = readFileSync(abs, 'utf8');
  const original = content;

  const toCatalog = [];
  const stayPlatform = [];
  const stayMember = [];

  content = content.replace(importRe, (full, typePrefix, spec, _path, source) => {
    const parts = parseSpec(spec);
    const catalogParts = [];
    const otherParts = [];
    for (const p of parts) {
      if (CATALOG_SYMBOLS.has(p.name)) catalogParts.push(p);
      else otherParts.push(p);
    }
    if (catalogParts.length) toCatalog.push(...catalogParts);
    if (otherParts.length) {
      const rebuilt = otherParts
        .map((p) => (p.isType ? `type ${p.name}` : p.alias ? `${p.name} as ${p.alias}` : p.name))
        .join(', ');
      const from = source === 'memberRoutes' ? 'memberRoutes' : 'platform';
      const depth = file.split('/').length - 2;
      const base = `${'../'.repeat(depth)}config/${from}`;
      return `import ${typePrefix ? 'type ' : ''}{ ${rebuilt} } from '${base}';`;
    }
    return '';
  });

  if (toCatalog.length) {
    const names = [...new Set(toCatalog.map((p) => p.name))];
    const catalogImport = `import { ${names.join(', ')} } from '${relCatalogImport(file)}';`;
    const firstImport = content.match(/^import .+$/m);
    if (firstImport) {
      if (!content.includes(catalogImport) && !content.includes("from '../config/routingCatalog'") && !content.includes('from "../../config/routingCatalog"')) {
        content = content.replace(firstImport[0], `${catalogImport}\n${firstImport[0]}`);
      }
    } else {
      content = `${catalogImport}\n${content}`;
    }
  }

  // Literal pro membership path in JSX / strings (consumer surfaces)
  if (
    !file.includes('memberRoutes') &&
    !file.includes('BecomeHost') &&
    !file.includes('ProfileProMembership') &&
    !file.includes('platform.ts')
  ) {
    content = content.replace(/to="\/profile\/pro-membership"/g, 'to={PRO_MEMBERSHIP_PATH}');
    content = content.replace(/to='\/profile\/pro-membership'/g, 'to={PRO_MEMBERSHIP_PATH}');
    if (content.includes('PRO_MEMBERSHIP_PATH') && !content.includes('PRO_MEMBERSHIP_PATH }')) {
      // ensure import if we added PRO_MEMBERSHIP_PATH usage
    }
  }

  if (content !== original) {
    writeFileSync(abs, content, 'utf8');
    changed += 1;
    console.log(`updated ${file}`);
  }
}

console.log(`[align-routing-imports] ${changed} files updated`);
