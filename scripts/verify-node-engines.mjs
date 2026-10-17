#!/usr/bin/env node
/**
 * Ensures local Node/npm meet package.json engines and .nvmrc pin.
 * @see README.md prerequisites
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const parseVersion = (value) =>
  String(value)
    .replace(/^v/i, '')
    .split(/[.-]/)
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isNaN(n) ? 0 : n;
    });

const compareVersions = (left, right) => {
  const a = parseVersion(left);
  const b = parseVersion(right);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const lv = a[i] ?? 0;
    const rv = b[i] ?? 0;
    if (lv > rv) return 1;
    if (lv < rv) return -1;
  }
  return 0;
};

const parseEngineMin = (engineRange) => {
  const trimmed = String(engineRange).trim();
  if (trimmed.startsWith('>=')) return trimmed.slice(2).trim();
  return trimmed;
};

let failed = false;
const fail = (msg) => {
  console.error(`[verify:engines] ${msg}`);
  failed = true;
};

const nodeMin = parseEngineMin(pkg.engines?.node ?? '24.22.0');
const npmMin = parseEngineMin(pkg.engines?.npm ?? '11.16.0');
const nodeCurrent = process.versions.node;
const npmCurrent = process.env.npm_config_user_agent?.match(/npm\/([\d.]+)/)?.[1] ?? '0.0.0';

if (compareVersions(nodeCurrent, nodeMin) < 0) {
  fail(
    `Node ${nodeCurrent} is below engines.node (>= ${nodeMin}). Install from .nvmrc: nvm install && nvm use`
  );
}

if (compareVersions(npmCurrent, npmMin) < 0) {
  fail(
    `npm ${npmCurrent} is below engines.npm (>= ${npmMin}). Run: npm install -g npm@${npmMin}`
  );
}

const nvmrcPath = join(root, '.nvmrc');
if (existsSync(nvmrcPath)) {
  const pin = readFileSync(nvmrcPath, 'utf8').trim();
  if (pin && compareVersions(nodeCurrent, pin) < 0) {
    fail(`Node ${nodeCurrent} is below .nvmrc pin ${pin} (CI uses this version).`);
  }
}

if (failed) {
  console.error('\n[verify:engines] FAILED — upgrade Node/npm before verify:system');
  process.exit(1);
}

console.log(
  `[verify:engines] OK — Node ${nodeCurrent} (>= ${nodeMin}), npm ${npmCurrent} (>= ${npmMin})`
);
