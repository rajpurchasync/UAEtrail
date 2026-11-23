#!/usr/bin/env node
/**
 * Fast local perf gate (plan §15.1 / Prompt 9). No live Lighthouse.
 * Optional Chrome Lighthouse: `npm run lighthouse:detail` (skips if Chrome/LHCI/dist missing).
 * PRs run it via .github/workflows/lighthouse.yml (warn assertions; not this quick gate).
 * 1) Static import graph: fail new unlazy leaflet/mapbox/gpx/markdown on the initial bundle.
 * 2) If dist exists, gzip first-load index JS and fail if > baseline + 5%.
 */
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';
import { finished } from 'node:stream/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const budget = JSON.parse(readFileSync(join(root, 'scripts/governance/detail-bundle-budget.json'), 'utf8'));

const BANNED = new Set(budget.bannedInitialModules ?? []);
const DETAIL_TEMPLATES = [
  'src/activity/detail/templates/ActivityDetailSections.tsx',
  'src/place/detail/templates/PlaceDetailSections.tsx',
  'src/facility/detail/templates/FacilityDetailSections.tsx',
  'src/plan/PlanTodayPage.tsx',
  'src/main.tsx',
  'src/App.tsx',
  'src/routing/appLazyPages.tsx',
];

const importRe = /from\s+['"]([^'"]+)['"]/g;
const lazyRe = /(?:lazy\s*\(\s*\(\)\s*=>\s*|import\s*\()\s*['"]([^'"]+)['"]/g;

const resolveImport = (fromFile, spec) => {
  if (!spec.startsWith('.')) return spec;
  const base = join(dirname(join(root, fromFile)), spec);
  for (const ext of ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx']) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return relative(root, candidate).replace(/\\/g, '/');
    }
  }
  return null;
};

const scanFile = (rel) => {
  const full = join(root, rel);
  if (!existsSync(full)) return { static: [], lazy: [] };
  const source = readFileSync(full, 'utf8');
  const staticSpecs = [];
  const lazySpecs = [];
  for (const match of source.matchAll(lazyRe)) lazySpecs.push(match[1]);
  const stripped = source.replace(lazyRe, '');
  for (const match of stripped.matchAll(importRe)) staticSpecs.push(match[1]);
  return { static: staticSpecs, lazy: lazySpecs };
};

const violations = [];
for (const file of DETAIL_TEMPLATES) {
  const { static: specs } = scanFile(file);
  for (const spec of specs) {
    const name = spec.replace(/^@/, '').split('/')[0];
    if (BANNED.has(spec) || BANNED.has(name) || /leaflet|mapbox|react-markdown|gpx/i.test(spec)) {
      violations.push(`${file} statically imports ${spec}`);
    }
    if (/\/MeetingPointMap$/.test(spec) || /\/PlaceTrackPreviewMap$/.test(spec)) {
      violations.push(`${file} statically imports map component ${spec}`);
    }
  }
}

if (violations.length) {
  console.error('[verify:perf] unlazy heavy modules on detail/initial graph:\n' + violations.join('\n'));
  process.exit(1);
}

const gzipFile = async (path) => {
  const gzip = createGzip({ level: 9 });
  let size = 0;
  gzip.on('data', (chunk) => {
    size += chunk.length;
  });
  createReadStream(path).pipe(gzip);
  await finished(gzip);
  return size;
};

const distDir = join(root, 'dist/assets');
if (existsSync(distDir)) {
  const files = readdirSync(distDir).filter((f) => /^index-.*\.js$/.test(f));
  let total = 0;
  for (const file of files) {
    total += await gzipFile(join(distDir, file));
  }
  const cap = Math.ceil(budget.firstLoadJsGzipBytes * (1 + budget.growthPercent / 100));
  console.log(
    `[verify:perf] first-load index JS gzip=${total}B (baseline ${budget.firstLoadJsGzipBytes}, cap ${cap}; plan target ${budget.planTargetGzipBytes})`
  );
  if (total > cap) {
    console.error('[verify:perf] first-load JS gzip grew more than 5% over recorded baseline');
    process.exit(1);
  }
} else {
  console.log('[verify:perf] dist/ missing — graph check only (run npm run build to measure gzip)');
}

console.log('[verify:perf] OK — detail lazy map/gpx/markdown graph + budget');
