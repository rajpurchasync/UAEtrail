#!/usr/bin/env node
/**
 * DMCP Phase 0 — validate scripts/authority-matrix.json against manifest + repo resolvers.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const matrixPath = join(root, 'scripts/authority-matrix.json');
const manifestPath = join(root, 'scripts/bounded-context-manifest.json');

let failed = false;
const fail = (msg) => {
  console.error(`[verify:authority-matrix] ${msg}`);
  failed = true;
};

if (!existsSync(matrixPath)) {
  fail('missing scripts/authority-matrix.json');
  process.exit(1);
}

const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const contextIds = new Set((manifest.contexts ?? []).map((c) => c.id));
const axisKeys = new Set(Object.keys(matrix.axes ?? {}));

const minActions = matrix.minActions ?? 40;
const actions = matrix.actions ?? [];
if (actions.length < minActions) {
  fail(`expected at least ${minActions} actions, got ${actions.length}`);
}

const ids = new Set();
for (const action of actions) {
  if (!action.id) fail('action missing id');
  if (ids.has(action.id)) fail(`duplicate action id ${action.id}`);
  ids.add(action.id);

  if (!axisKeys.has(action.axis)) {
    fail(`${action.id}: unknown axis ${action.axis}`);
  }
  if (!contextIds.has(action.contextId)) {
    fail(`${action.id}: contextId ${action.contextId} not in bounded-context-manifest.json`);
  }

  const resolver = action.resolver;
  if (!resolver?.module || !resolver?.symbol) {
    fail(`${action.id}: resolver.module and resolver.symbol required`);
    continue;
  }

  const modulePath = join(root, resolver.module);
  if (!existsSync(modulePath)) {
    fail(`${action.id}: missing resolver module ${resolver.module}`);
    continue;
  }

  const source = readFileSync(modulePath, 'utf8');
  const sym = resolver.symbol;
  const symbolPattern = new RegExp(
    `export\\s+(?:async\\s+)?(?:const|function)\\s+${sym}\\b|export\\s*\\{[^}]*\\b${sym}\\b`
  );
  if (!symbolPattern.test(source)) {
    fail(`${action.id}: symbol ${sym} not exported from ${resolver.module}`);
  }
}

for (const choke of matrix.readCompatChokePoints ?? []) {
  const modulePath = join(root, choke.module);
  if (!existsSync(modulePath)) {
    fail(`readCompat ${choke.id}: missing ${choke.module}`);
  }
}

for (const rule of matrix.forbiddenPatterns ?? []) {
  if (rule.pathMustNotExist) {
    const bad = join(root, rule.pathMustNotExist);
    if (existsSync(bad)) {
      fail(`forbidden path exists: ${rule.pathMustNotExist} (${rule.id})`);
    }
  }
}

const byAxis = {};
for (const action of actions) {
  byAxis[action.axis] = (byAxis[action.axis] ?? 0) + 1;
}

console.log('[verify:authority-matrix] scorecard');
console.log(`  actions: ${actions.length} (min ${minActions})`);
console.log(`  axes: ${JSON.stringify(byAxis)}`);
console.log(`  readCompat choke points: ${(matrix.readCompatChokePoints ?? []).length}`);
console.log(`  forbidden pattern rules: ${(matrix.forbiddenPatterns ?? []).length}`);

if (failed) {
  process.exit(1);
}
console.log('[verify:authority-matrix] OK');