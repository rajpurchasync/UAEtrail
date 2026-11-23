#!/usr/bin/env node
/**
 * Guest SPA transfer-size smoke for / and /explore (Playwright).
 *
 * Usage:
 *   npm run build && npx vite preview --port 4173
 *   node scripts/dev/perf-ui-benchmark.mjs --label before|after
 *   node scripts/dev/perf-ui-benchmark.mjs --compare
 *
 * Env: PREVIEW_URL (default http://127.0.0.1:4173)
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RESULTS_DIR = join(ROOT, 'scripts/dev/perf-results');
const base = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173';

const args = process.argv.slice(2);
const labelArg = args.find((a) => a.startsWith('--label='))?.split('=')[1]
  ?? (args.includes('--label') ? args[args.indexOf('--label') + 1] : null);
const compareMode = args.includes('--compare');

const measureRoute = async (page, path) => {
  const requests = [];
  const onRequest = (req) => {
    requests.push({ url: req.url(), resourceType: req.resourceType() });
  };
  page.on('request', onRequest);

  const start = performance.now();
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  const loadMs = Math.round(performance.now() - start);

  let transferBytes = 0;
  let jsBytes = 0;
  let cssBytes = 0;
  for (const entry of requests) {
    try {
      const res = await page.request.get(entry.url).catch(() => null);
      if (!res) continue;
      const len = Number(res.headers()['content-length'] ?? 0);
      transferBytes += len;
      if (entry.resourceType === 'script') jsBytes += len;
      if (entry.resourceType === 'stylesheet') cssBytes += len;
    } catch {
      /* cross-origin tiles etc. */
    }
  }

  page.off('request', onRequest);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadEventEnd: nav ? Math.round(nav.loadEventEnd) : null,
    };
  });

  let jsHeapUsed = null;
  try {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const heap = await cdp.send('Runtime.evaluate', {
      expression: 'performance.memory ? performance.memory.usedJSHeapSize : null',
      returnByValue: true,
    });
    jsHeapUsed = heap.result.value;
  } catch {
    /* optional */
  }

  return {
    path,
    requestCount: requests.length,
    transferBytesEstimate: transferBytes,
    jsBytesEstimate: jsBytes,
    cssBytesEstimate: cssBytes,
    networkIdleMs: loadMs,
    domContentLoadedMs: metrics.domContentLoaded,
    loadEventEndMs: metrics.loadEventEnd,
    jsHeapUsed,
  };
};

const runSuite = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const routes = ['/', '/explore'];
  const results = [];
  for (const route of routes) {
    results.push(await measureRoute(page, route));
  }
  await browser.close();
  return {
    capturedAt: new Date().toISOString(),
    previewUrl: base,
    routes: results,
  };
};

const compareReports = (before, after) => {
  console.log('\n[perf-ui-benchmark] before → after');
  for (const b of before.routes) {
    const a = after.routes.find((r) => r.path === b.path);
    if (!a) continue;
    console.log(`  ${b.path}`);
    console.log(
      `    requests ${b.requestCount} → ${a.requestCount}  transfer~ ${b.transferBytesEstimate} → ${a.transferBytesEstimate} B`
    );
    console.log(
      `    networkIdle ${b.networkIdleMs}ms → ${a.networkIdleMs}ms  DCL ${b.domContentLoadedMs}ms → ${a.domContentLoadedMs}ms`
    );
  }
};

const main = async () => {
  if (compareMode) {
    const beforePath = join(RESULTS_DIR, 'ui-before.json');
    const afterPath = join(RESULTS_DIR, 'ui-after.json');
    if (!existsSync(beforePath) || !existsSync(afterPath)) {
      console.error('[perf-ui-benchmark] Need ui-before.json and ui-after.json');
      process.exit(1);
    }
    compareReports(
      JSON.parse(readFileSync(beforePath, 'utf8')),
      JSON.parse(readFileSync(afterPath, 'utf8'))
    );
    return;
  }

  const report = await runSuite();
  console.log(`[perf-ui-benchmark] ${report.previewUrl}`);
  for (const row of report.routes) {
    console.log(
      `  ${row.path} requests=${row.requestCount} transfer~=${row.transferBytesEstimate}B networkIdle=${row.networkIdleMs}ms DCL=${row.domContentLoadedMs}ms`
    );
  }

  if (labelArg === 'before' || labelArg === 'after') {
    mkdirSync(RESULTS_DIR, { recursive: true });
    const file = labelArg === 'before' ? 'ui-before.json' : 'ui-after.json';
    writeFileSync(join(RESULTS_DIR, file), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`[perf-ui-benchmark] wrote scripts/dev/perf-results/${file}`);
  }
};

main().catch((err) => {
  console.error('[perf-ui-benchmark] FAILED', err);
  process.exit(1);
});
