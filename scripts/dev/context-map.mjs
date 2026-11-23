#!/usr/bin/env node
/**
 * Generated bounded-context module map (code-first onboarding).
 * Writes scripts/dev/context-map.md — do not edit by hand; regenerate: npm run context:map
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifestPath = join(root, 'scripts/governance/bounded-context-manifest.json');
const outPath = join(root, 'scripts/dev/context-map.md');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const contexts = manifest.contexts ?? [];
const generated = new Date().toISOString().slice(0, 10);

const lines = [
  '# Bounded-context module map (generated)',
  '',
  `Generated **${generated}** from \`scripts/governance/bounded-context-manifest.json\`.`,
  '**Do not edit.** Regenerate: `npm run context:map`.',
  '',
  'Truth order: `wire-lexicon.ts` → manifest → running code → Tier-1 markdown.',
  '',
  '| Context | API / services | FE domains | FE roots |',
  '|---------|----------------|------------|----------|',
];

for (const ctx of contexts) {
  const api = [...(ctx.routeRegistrars ?? []), ...(ctx.apiFiles ?? [])]
    .slice(0, 4)
    .map((p) => `\`${p}\``)
    .join('<br>');
  const apiMore =
    (ctx.routeRegistrars?.length ?? 0) + (ctx.apiFiles?.length ?? 0) > 4
      ? '<br>…'
      : '';
  const feDomains = (ctx.feDomains ?? []).map((p) => `\`${p}\``).join('<br>') || '—';
  const feRoots = (ctx.feRoots ?? []).slice(0, 5).map((p) => `\`${p}\``).join('<br>');
  const feMore = (ctx.feRoots?.length ?? 0) > 5 ? '<br>…' : '';
  lines.push(`| **${ctx.id}** (${ctx.label ?? ctx.id}) | ${api}${apiMore} | ${feDomains} | ${feRoots}${feMore} |`);
}

lines.push('');
lines.push('## Discovery consolidation');
lines.push('');
lines.push('- **Runtime entry (FE):** `src/explore/discoveryRuntime.ts` — map HTTP + routing + card projection.');
lines.push('- **Import audit:** `npm run discovery:import-audit` → `scripts/governance/discovery-import-audit.json`.');
lines.push('- **Card projections:** `src/discovery/index.ts` — list/map/browse UI builds on the same models.');
lines.push('');

const missing = [];
for (const ctx of contexts) {
  for (const rel of [...(ctx.feRoots ?? []), ...(ctx.apiFiles ?? []), ...(ctx.routeRegistrars ?? [])]) {
    if (!existsSync(join(root, rel))) missing.push(`${ctx.id}: ${rel}`);
  }
}
if (missing.length > 0) {
  lines.push('## Manifest path warnings');
  lines.push('');
  for (const m of missing) lines.push(`- missing: ${m}`);
  lines.push('');
}

writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`[context:map] wrote ${outPath} (${contexts.length} contexts)`);
if (missing.length > 0) {
  console.warn(`[context:map] ${missing.length} manifest path(s) missing on disk`);
  process.exitCode = 1;
}