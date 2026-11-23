#!/usr/bin/env node
/**
 * Phase P0 — lightweight repo census (routes, manifest, experiment doc count, knip).
 * Writes scripts/governance/repo-census-baseline.json
 *
 * Usage: npm run repo:census [-- --skip-knip]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const skipKnip = process.argv.includes('--skip-knip');
const manifestPath = join(root, 'scripts/governance/bounded-context-manifest.json');
/** @see scripts/dev/system-audit.mjs — SPA routes live in src/routing/AppRoutes.tsx. */
const appRoutesPath = join(root, 'src/routing/AppRoutes.tsx');
const apiRoutesDir = join(root, 'apps/api/src/routes');
const outPath = join(root, 'scripts/governance/repo-census-baseline.json');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const contexts = manifest.contexts ?? [];

let spaRouteElements = 0;
if (existsSync(appRoutesPath)) {
  const app = readFileSync(appRoutesPath, 'utf8');
  spaRouteElements = (app.match(/<Route\b/g) ?? []).length;
}

const countRegistrarFiles = (dir) => {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const rel = join(dir, name.name);
    if (name.isDirectory()) {
      n += countRegistrarFiles(rel);
    } else if (/^register[A-Z].*Routes\.ts$/.test(name.name)) {
      n += 1;
    }
  }
  return n;
};

const apiRegistrarFileCount = countRegistrarFiles(apiRoutesDir);

const experimentDir = join(root, 'docs/experiment');
const experimentPlans = readdirSync(experimentDir).filter(
  (f) => f.endsWith('.md') && f !== 'README.md'
);

const stubbed = experimentPlans.filter((f) => {
  const text = readFileSync(join(experimentDir, f), 'utf8');
  return text.startsWith('> Superseded by');
});

let knip = { skipped: skipKnip };
if (!skipKnip) {
  try {
    const raw = execSync('npx knip --reporter json --no-exit-code', {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 25 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const report = JSON.parse(raw);
    const issues = report.issues ?? [];
    knip = {
      issueCount: issues.length,
      generated: new Date().toISOString().slice(0, 10),
      note: 'Run npm run knip to burn down; census stores count only',
    };
  } catch (error) {
    knip = {
      error: 'knip failed to run',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

const baseline = {
  version: 1,
  generated: new Date().toISOString().slice(0, 10),
  description: 'Phase P0 repo census baseline. Regenerate: npm run repo:census',
  boundedContextCount: contexts.length,
  manifestVersion: manifest.version,
  spaRouteElements: spaRouteElements,
  apiRegistrarFileCount,
  experimentPlanFiles: experimentPlans.length,
  experimentStubbedFiles: stubbed.length,
  feRootsTotal: contexts.reduce((n, c) => n + (c.feRoots?.length ?? 0), 0),
  apiRegistrarRefsInManifest: contexts.reduce((n, c) => n + (c.routeRegistrars?.length ?? 0), 0),
  knip,
};

writeFileSync(outPath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
console.log(`[repo:census] wrote ${outPath}`);
console.log(JSON.stringify(baseline, null, 2));
