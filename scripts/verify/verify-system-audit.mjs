#!/usr/bin/env node
/**
 * Validates system-audit outputs exist and meet W0 thresholds.
 * @see scripts/governance/cto-audit-pillars.json
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const baselinePath = join(root, 'scripts/governance/system-audit-baseline.json');
const routesPath = join(root, 'scripts/governance/system-audit-routes.json');
const pillarsPath = join(root, 'scripts/governance/cto-audit-pillars.json');

let failed = false;
const fail = (msg) => {
  console.error(`[verify:system-audit] ${msg}`);
  failed = true;
};

for (const p of [baselinePath, routesPath, pillarsPath]) {
  if (!existsSync(p)) fail(`missing ${p.replace(root + '/', '')}`);
}

if (failed) process.exit(1);

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const routes = JSON.parse(readFileSync(routesPath, 'utf8'));
const pillars = JSON.parse(readFileSync(pillarsPath, 'utf8'));

if (pillars.pillars?.length !== 12) {
  fail(`expected 12 audit pillars, got ${pillars.pillars?.length ?? 0}`);
}

const s = baseline.summary ?? {};
if ((s.apiRouteEndpointsParsed ?? 0) < 80) {
  fail(`apiRouteEndpointsParsed too low: ${s.apiRouteEndpointsParsed}`);
}
if ((routes.endpoints?.length ?? 0) !== s.apiRouteEndpointsParsed) {
  fail('system-audit-routes.json endpoint count mismatch vs baseline summary');
}
if ((s.apiRegistrarFiles ?? 0) < 40) {
  fail(`apiRegistrarFiles too low: ${s.apiRegistrarFiles}`);
}

const rewardOrphan = (baseline.risks?.orphanCollections ?? []).find(
  (c) => c.key === 'REWARD_LEDGERS'
);
if (!rewardOrphan) {
  // REWARD_LEDGERS may still be referenced — only warn on unexpected orphans
}

if (failed) {
  console.error('\n[verify:system-audit] FAILED — run npm run system:audit');
  process.exit(1);
}

console.log(
  `[verify:system-audit] OK — ${s.apiRouteEndpointsParsed} endpoints, ${s.mongoCollectionsDefined} collections, ${s.routeRegistrarsWithDirectWrites ?? 0} route write violations flagged`
);
