#!/usr/bin/env node
/**
 * S10e / C19 — explore map bbox staging promotion checklist (human + curl smoke).
 * Does not enable flags or call staging; prints steps only.
 * @see docs/operations/EXPLORE_MAP_RUNBOOK.md § bbox bbox fetch
 * @see docs/PRE_DEPLOY_CHECKLIST.md release gates
 */
import { spawnSync } from 'node:child_process';
import { stripNpmDevdirEnv, stripNpmDevdirFromProcess } from './strip-npm-devdir-env.mjs';

stripNpmDevdirFromProcess();

const apiBase = (process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const feBase = (process.env.BASE_URL || 'http://localhost:5175').replace(/\/$/, '');
const runVerify = process.argv.includes('--verify');

console.log('# S10e — Explore map bbox staging promotion (C19)\n');
console.log('Do **not** enable in production until staging p95 gate passes.\n');

console.log('## 1. Automated gates (on release commit, local or CI)\n');
console.log('- npm run verify:system');
console.log('- npm run test:explore-alignment  (API explore-map-bbox + map layers + FE guards)\n');

if (runVerify) {
  console.log('Running verify:system:quick …\n');
  const r = spawnSync('npm', ['run', 'verify:system:quick'], {
    stdio: 'inherit',
    shell: true,
    env: stripNpmDevdirEnv(),
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log('\nverify:system:quick OK\n');
}

console.log('## 2. Staging environment flags (both required)\n');
console.log('| Where | Variable | Value |');
console.log('|-------|----------|-------|');
console.log('| API container / `.env` | `EXPLORE_MAP_BBOX` | `1` |');
console.log('| Frontend **build** | `VITE_EXPLORE_MAP_BBOX` | `1` |');
console.log('');
console.log('Restart API after API env change. Rebuild/redeploy FE after Vite flag change.\n');

console.log('## 3. Local dev smoke (optional before staging)\n');
console.log('With API running (`EXPLORE_MAP_BBOX=1 npm run dev:api`): `npm run s10e:local-ratio` — full vs bbox byte ratio (exit 2 if above 40% target).\n');
console.log('```');
console.log('# Terminal A — API');
console.log('EXPLORE_MAP_BBOX=1 npm run dev:api');
console.log('');
console.log('# Terminal B — FE');
console.log('VITE_EXPLORE_MAP_BBOX=1 npm run dev');
console.log('```');
console.log(`Then open ${feBase}/explore — pan/zoom; DevTools network should show bbox query params.\n`);

console.log('## 4. Staging UI smoke\n');
const smoke = [
  `Open ${feBase}/explore — pan/zoom; network shows GET …/explore/map?bbox=… (not only full map).`,
  'Join an open-RSVP activity from map peek — slot count updates without full map reload.',
  `Open ${feBase}/explore?list=1 — list still uses full map fetch (no bbox-only list break).`,
  'Roll back: unset both flags; wire falls back to full-region GET /explore/map.',
];
for (const line of smoke) {
  console.log(`- ${line}`);
}
console.log('');

console.log('## 5. p95 payload ratio (promotion gate)\n');
console.log(`Full map size sample:`);
console.log(`  curl -sS -o /tmp/explore-map-full.json -w '%{size_download}\\n' '${apiBase}/api/explore/map'`);
console.log(`Viewport bbox sample (adjust bbox to your staging viewport):`);
console.log(
  `  curl -sS -o /tmp/explore-map-bbox.json -w '%{size_download}\\n' '${apiBase}/api/explore/map?bbox=54.9,24.9,55.5,25.5&limit=200'`
);
console.log('Target: bbox JSON < ~40% of full map at comparable catalog size (see explore-map-bbox-spec §8).\n');

console.log('## 6. After S10e — S10f manual QA\n');
console.log(`BASE_URL=${feBase} npm run s10f:qa-checklist\n`);

console.log('Canonical: docs/operations/EXPLORE_MAP_RUNBOOK.md · docs/PRE_DEPLOY_CHECKLIST.md');
