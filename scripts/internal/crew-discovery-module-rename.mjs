/**
 * Rename FE module `src/people-discovery` → `src/crew-discovery` (Find crew).
 * Run: node scripts/internal/crew-discovery-module-rename.mjs
 */
import { existsSync, readFileSync, renameSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const FROM = join(ROOT, 'src/people-discovery');
const TO = join(ROOT, 'src/crew-discovery');

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vitest']);

const REPLACEMENTS = [
  ['@/people-discovery', '@/crew-discovery'],
  ['src/people-discovery', 'src/crew-discovery'],
  ['people-discovery/', 'crew-discovery/'],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx|md|json|mjs)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

function applyText(content) {
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  // Routing — canonical exploreCrewsPath only (no TS path aliases)
  next = next.split('explorePeopleBrowsePath').join('exploreCrewsPath');
  next = next.split('exploreCrewDiscoveryPath').join('exploreCrewsPath');
  next = next.split('(`people-discovery`').join('(`crew-discovery`');
  next = next.split('(people-discovery`').join('(crew-discovery`');
  return next;
}

if (existsSync(FROM) && !existsSync(TO)) {
  try {
    renameSync(FROM, TO);
  } catch {
    console.warn('rename failed — ensure src/crew-discovery exists and src/people-discovery is removed');
  }
}
if (!existsSync(TO)) {
  console.error('Expected src/crew-discovery');
  process.exit(1);
}

const roots = [
  join(ROOT, 'src'),
  join(ROOT, 'scripts'),
  join(ROOT, 'docs'),
  join(ROOT, 'apps'),
];
for (const root of roots) {
  if (!existsSync(root)) continue;
  for (const file of walk(root)) {
    if (file.includes('crew-discovery-module-rename.mjs')) continue;
    const before = readFileSync(file, 'utf8');
    const after = applyText(before);
    if (after !== before) writeFileSync(file, after, 'utf8');
  }
}

// Deprecated path shim (imports only — no runtime code)
const shimDir = join(ROOT, 'src/people-discovery');
if (!existsSync(shimDir)) {
  // Only README to steer agents; guard forbids new code under people-discovery
}

console.log('crew-discovery-module-rename: done');