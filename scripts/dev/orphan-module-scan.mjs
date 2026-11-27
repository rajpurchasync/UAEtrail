#!/usr/bin/env node
/** Heuristic orphan scan — module basename never imported outside itself (prod src only). */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

const collect = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) collect(p, out);
    else if (
      /\.(ts|tsx)$/.test(e.name) &&
      !e.name.endsWith('.test.ts') &&
      !e.name.endsWith('.test.tsx')
    ) {
      out.push(relative(ROOT, p).replace(/\\/g, '/'));
    }
  }
  return out;
};

const allText = new Map();
const indexAll = (dir) => {
  for (const rel of collect(dir)) {
    allText.set(rel, readFileSync(join(ROOT, rel), 'utf8'));
  }
};
indexAll(join(ROOT, 'src'));

const SKIP = new Set([
  'src/main.tsx',
  'src/App.tsx',
  'src/vite-env.d.ts',
]);

const orphans = [];
for (const rel of allText.keys()) {
  if (SKIP.has(rel)) continue;
  const base = basename(rel).replace(/\.(tsx?)$/, '');
  if (base === 'index') continue;
  let refs = 0;
  for (const [other, text] of allText) {
    if (other === rel) continue;
    if (text.includes(base)) refs += 1;
  }
  if (refs === 0) orphans.push(rel);
}

orphans.sort();
console.log(`[orphan-module-scan] ${orphans.length} candidate(s)`);
for (const o of orphans) console.log(o);