#!/usr/bin/env node
/**
 * Count cross-folder imports between discovery projections (explore · list · discovery).
 * Writes scripts/discovery-import-audit.json — npm run discovery:import-audit
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'scripts/discovery-import-audit.json');

const SOURCE_ROOTS = [
  'src/list',
  'src/discovery',
  'src/activity-discovery',
  'src/places-discovery',
  'src/people-discovery',
];

const IMPORT_RE =
  /from\s+['"](\.\.\/[^'"]+|\.\/[^'"]+)['"]|import\s+['"](\.\.\/[^'"]+|\.\/[^'"]+)['"]/g;

const walkTs = (dir, acc = []) => {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules') continue;
      walkTs(abs, acc);
    } else if (/\.(ts|tsx)$/.test(ent.name) && !ent.name.endsWith('.test.ts') && !ent.name.endsWith('.test.tsx')) {
      acc.push(abs);
    }
  }
  return acc;
};

/** @type {Record<string, Record<string, number>>} */
const matrix = {};
/** @type {Record<string, number>} */
const byTarget = {};

for (const relRoot of SOURCE_ROOTS) {
  const absRoot = join(root, relRoot);
  let files;
  try {
    files = walkTs(absRoot);
  } catch {
    continue;
  }
  matrix[relRoot] = {};
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    let m;
    while ((m = IMPORT_RE.exec(text)) !== null) {
      const spec = m[1] ?? m[2];
      if (!spec?.startsWith('../')) continue;
      const top = spec.split('/').slice(0, 2).join('/'); // ../explore or ../list
      const bucket = top.replace('../', '');
      matrix[relRoot][bucket] = (matrix[relRoot][bucket] ?? 0) + 1;
      byTarget[bucket] = (byTarget[bucket] ?? 0) + 1;
    }
    IMPORT_RE.lastIndex = 0;
  }
}

const listExplore = matrix['src/list']?.explore ?? 0;
const limits = {
  maxListExploreImports: 25,
  listFacade: 'src/list/discoveryListRuntime.ts',
};

const report = {
  version: 1,
  dmcpPhase: 3,
  generated: new Date().toISOString().slice(0, 10),
  description: 'Cross-import counts from list/discovery/* into sibling folders. Prefer src/list/discoveryListRuntime.ts over deep explore/* paths.',
  sourceRoots: SOURCE_ROOTS,
  matrix,
  byTarget,
  limits,
  listExploreImports: listExplore,
  canonicalRuntime: 'src/explore/discoveryRuntime.ts',
};

writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`[discovery:import-audit] wrote ${outPath}`);
console.log(`[discovery:import-audit] src/list → explore: ${listExplore} (max ${limits.maxListExploreImports})`);
console.log(JSON.stringify(byTarget, null, 2));

if (listExplore > limits.maxListExploreImports) {
  console.error(
    `[discovery:import-audit] FAILED — list explore imports ${listExplore} > ${limits.maxListExploreImports}`
  );
  process.exit(1);
}