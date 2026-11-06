#!/usr/bin/env node
/**
 * Local API performance harness — before/after comparison for the performance pass.
 *
 * Usage:
 *   node scripts/perf-benchmark.mjs --label before
 *   node scripts/perf-benchmark.mjs --label after
 *   node scripts/perf-benchmark.mjs --compare
 *
 * Env: BASE_URL (default http://localhost:4000), PERF_SAMPLES (default 8)
 *      P5_SMOKE_EMAIL + P5_SMOKE_PASSWORD — optional overlay + /me/status probes
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS_DIR = join(ROOT, 'scripts/perf-results');
const baseUrl = (process.env.BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const samples = Number(process.env.PERF_SAMPLES ?? 8);

const args = process.argv.slice(2);
const labelArg = args.find((a) => a.startsWith('--label='))?.split('=')[1]
  ?? (args.includes('--label') ? args[args.indexOf('--label') + 1] : null);
const compareMode = args.includes('--compare');

const percentile = (sorted, p) => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
};

const timedRequest = async (input) => {
  const url = `${baseUrl}${input.path}`;
  const start = performance.now();
  const res = await fetch(url, {
    method: input.method ?? 'GET',
    headers: input.headers ?? { accept: 'application/json' },
    body: input.body,
  });
  const ms = performance.now() - start;
  const body = await res.text();
  return {
    label: input.label,
    path: input.path,
    status: res.status,
    ms,
    ok: res.ok,
    bytes: body.length,
  };
};

const runSeries = async (input) => {
  const runs = [];
  for (let i = 0; i < samples; i += 1) {
    runs.push(await timedRequest(input));
  }
  const durations = runs.map((r) => r.ms).sort((a, b) => a - b);
  const byteSamples = runs.map((r) => r.bytes);
  return {
    label: input.label,
    path: input.path,
    samples: runs.length,
    errors: runs.filter((r) => !r.ok).length,
    p50Ms: Math.round(percentile(durations, 50)),
    p95Ms: Math.round(percentile(durations, 95)),
    avgBytes: Math.round(byteSamples.reduce((a, b) => a + b, 0) / byteSamples.length),
    lastStatus: runs[runs.length - 1]?.status,
  };
};

const loginMember = async (email, password) => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`login failed (${res.status})`);
  }
  return json.tokens?.accessToken;
};

const invalidateExploreCache = async () => {
  try {
    await fetch(`${baseUrl}/health`);
  } catch {
    /* ignore */
  }
};

const collectProbes = async () => {
  const probes = [
    runSeries({ label: 'explore_map_warm', path: '/api/explore/map' }),
    runSeries({ label: 'activities_page1', path: '/api/activities?page=1&pageSize=20' }),
    runSeries({ label: 'health', path: '/health' }),
  ];

  const email = process.env.P5_SMOKE_EMAIL?.trim();
  const password = process.env.P5_SMOKE_PASSWORD;
  if (email && password) {
    const token = await loginMember(email, password);
    const authHeaders = { accept: 'application/json', authorization: `Bearer ${token}` };
    probes.push(
      runSeries({ label: 'me_status', path: '/api/me/status', headers: authHeaders }),
      runSeries({ label: 'explore_overlay', path: '/api/me/discover/overlay', headers: authHeaders })
    );
  }

  const rows = await Promise.all(probes);
  return {
    capturedAt: new Date().toISOString(),
    baseUrl,
    samples,
    probes: rows,
  };
};

const printTable = (report) => {
  console.log(`\n[perf-benchmark] ${report.capturedAt} BASE_URL=${report.baseUrl} n=${report.samples}`);
  for (const row of report.probes) {
    console.log(
      `  ${row.label.padEnd(22)} p50=${String(row.p50Ms).padStart(5)}ms p95=${String(row.p95Ms).padStart(5)}ms avgBytes=${row.avgBytes} status=${row.lastStatus} err=${row.errors}/${row.samples}`
    );
  }
};

const compareReports = (before, after) => {
  console.log('\n[perf-benchmark] before → after');
  console.log('  label                  p50        p95        bytes');
  const afterByLabel = new Map(after.probes.map((p) => [p.label, p]));
  for (const b of before.probes) {
    const a = afterByLabel.get(b.label);
    if (!a) continue;
    const fmt = (v, prev, suffix = 'ms') => {
      const delta = v - prev;
      const sign = delta >= 0 ? '+' : '';
      return `${v}${suffix} (${sign}${suffix === 'ms' ? Math.round(delta) : delta}${suffix})`;
    };
    console.log(
      `  ${b.label.padEnd(22)} ${fmt(a.p50Ms, b.p50Ms)}  ${fmt(a.p95Ms, b.p95Ms)}  ${fmt(a.avgBytes, b.avgBytes, 'B')}`
    );
  }
};

const main = async () => {
  if (compareMode) {
    const beforePath = join(RESULTS_DIR, 'before.json');
    const afterPath = join(RESULTS_DIR, 'after.json');
    if (!existsSync(beforePath) || !existsSync(afterPath)) {
      console.error('[perf-benchmark] Need scripts/perf-results/before.json and after.json');
      process.exit(1);
    }
    compareReports(
      JSON.parse(readFileSync(beforePath, 'utf8')),
      JSON.parse(readFileSync(afterPath, 'utf8'))
    );
    return;
  }

  try {
    const health = await fetch(`${baseUrl}/health`);
    if (!health.ok) {
      console.error(`[perf-benchmark] ${baseUrl}/health returned ${health.status}`);
      process.exit(1);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[perf-benchmark] Cannot reach ${baseUrl}/health (${detail})`);
    process.exit(1);
  }

  await invalidateExploreCache();
  const cold = await timedRequest({ label: 'explore_map_cold', path: '/api/explore/map' });
  const report = await collectProbes();
  report.probes.unshift({
    label: 'explore_map_cold',
    path: '/api/explore/map',
    samples: 1,
    errors: cold.ok ? 0 : 1,
    p50Ms: Math.round(cold.ms),
    p95Ms: Math.round(cold.ms),
    avgBytes: cold.bytes,
    lastStatus: cold.status,
  });

  printTable(report);

  if (labelArg === 'before' || labelArg === 'after') {
    mkdirSync(RESULTS_DIR, { recursive: true });
    const outPath = join(RESULTS_DIR, `${labelArg}.json`);
    writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`[perf-benchmark] wrote ${outPath}`);
  }
};

main().catch((err) => {
  console.error('[perf-benchmark] FAILED', err);
  process.exit(1);
});
