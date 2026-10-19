#!/usr/bin/env node
/**
 * P5 staging baseline — latency + error-budget smoke (not load test).
 * `--preflight` / `P5_SLO_PREFLIGHT=1` asserts slos[] ↔ probes ↔ PRE_DEPLOY (no live API).
 * @see scripts/refactor-program.json P5 slos · docs/PRE_DEPLOY_CHECKLIST.md § SLO baseline
 *
 * Env:
 *   BASE_URL (default http://localhost:4000 — matches API PORT / docker-compose)
 *   P5_SLO_SAMPLES (default 5)
 *   P5_EXPLORE_MAP_BBOX=1 — also sample GET /api/explore/map?bbox=… (requires API EXPLORE_MAP_BBOX=1)
 *   P5_EXPLORE_MAP_BBOX_QUERY (default 55,25,56,26)
 *   P5_SMOKE_EMAIL + P5_SMOKE_PASSWORD — optional overlay probe (SLO-EXPLORE-OVERLAY)
 *   P5_SMOKE_EMAIL + P5_SMOKE_PASSWORD + P5_JOIN_ACTIVITY_ID — optional join/RSVP probe (SLO-JOIN)
 *   P5_ACTIVITY_ID — optional guest GET /api/activities/:id latency samples (L3 public read; defaults to P5_JOIN_ACTIVITY_ID when set)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = (process.env.BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const samples = Number(process.env.P5_SLO_SAMPLES ?? 5);
const bboxQuery = process.env.P5_EXPLORE_MAP_BBOX_QUERY ?? '55,25,56,26';
const isPreflight =
  process.argv.includes('--preflight') || process.env.P5_SLO_PREFLIGHT === '1';

const REQUIRED_SLO_IDS = [
  'SLO-EXPLORE-MAP',
  'SLO-EXPLORE-OVERLAY',
  'SLO-JOIN',
  'SLO-API-ERR',
];

const percentile = (sorted, p) => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
};

const parseErrorCode = (body) => {
  try {
    const json = JSON.parse(body);
    return json.error?.code ?? null;
  } catch {
    return null;
  }
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
  const serverError = res.status >= 500;
  const clientOk = res.ok || (input.count4xxAsNonError && res.status >= 400 && res.status < 500);
  return {
    label: input.label,
    path: input.path,
    status: res.status,
    ms,
    ok: clientOk && !serverError,
    serverError,
    bytes: body.length,
    errorCode: parseErrorCode(body),
  };
};

const runSeries = async (input) => {
  const runs = [];
  for (let i = 0; i < samples; i += 1) {
    runs.push(await timedRequest(input));
  }
  const durations = runs.map((r) => r.ms).sort((a, b) => a - b);
  const errors = runs.filter((r) => !r.ok).length;
  const serverErrors = runs.filter((r) => r.serverError).length;
  return {
    label: input.label,
    path: input.path,
    samples: runs.length,
    errors,
    serverErrors,
    p50Ms: Math.round(percentile(durations, 50)),
    p95Ms: Math.round(percentile(durations, 95)),
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
    throw new Error(`login failed (${res.status}): ${json.error?.code ?? 'unknown'}`);
  }
  const token = json.tokens?.accessToken;
  if (!token) {
    throw new Error('login response missing accessToken');
  }
  return token;
};

const joinPathSucceeded = (status) => status === 201 || status === 409;

const probeJoinPath = async () => {
  const email = process.env.P5_SMOKE_EMAIL?.trim();
  const password = process.env.P5_SMOKE_PASSWORD;
  const activityId = process.env.P5_JOIN_ACTIVITY_ID?.trim();
  if (!email || !password || !activityId) {
    console.log(
      '[p5:slo-smoke] join probe skipped — set P5_SMOKE_EMAIL, P5_SMOKE_PASSWORD, P5_JOIN_ACTIVITY_ID'
    );
    return { skipped: true };
  }

  const accessToken = await loginMember(email, password);
  const headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    authorization: `Bearer ${accessToken}`,
  };

  const detailRes = await timedRequest({
    label: 'activity_detail',
    path: `/api/activities/${activityId}`,
    headers: { accept: 'application/json', authorization: `Bearer ${accessToken}` },
  });
  if (detailRes.status === 404 || detailRes.serverError) {
    console.log(
      `[p5:slo-smoke] join probe activity GET status=${detailRes.status} ${detailRes.ms}ms`
    );
    return { skipped: false, ok: false, mechanism: 'detail', status: detailRes.status };
  }

  const rsvpRes = await timedRequest({
    label: 'join_rsvp',
    path: `/api/activities/${activityId}/rsvp`,
    method: 'POST',
    headers,
    body: '{}',
    count4xxAsNonError: true,
  });

  if (joinPathSucceeded(rsvpRes.status)) {
    console.log(
      `[p5:slo-smoke] join probe rsvp status=${rsvpRes.status} ${rsvpRes.ms}ms code=${rsvpRes.errorCode ?? '-'}`
    );
    return { skipped: false, ok: true, mechanism: 'rsvp', status: rsvpRes.status };
  }

  if (rsvpRes.serverError) {
    console.log(`[p5:slo-smoke] join probe rsvp status=${rsvpRes.status} ${rsvpRes.ms}ms`);
    return { skipped: false, ok: false, mechanism: 'rsvp', status: rsvpRes.status };
  }

  const requestRes = await timedRequest({
    label: 'join_request',
    path: `/api/activities/${activityId}/requests`,
    method: 'POST',
    headers,
    body: JSON.stringify({ note: 'P5 staging join smoke probe' }),
    count4xxAsNonError: true,
  });

  const ok = joinPathSucceeded(requestRes.status);
  console.log(
    `[p5:slo-smoke] join probe requests status=${requestRes.status} ${requestRes.ms}ms code=${requestRes.errorCode ?? '-'} ok=${ok}`
  );
  if (!ok || requestRes.serverError) {
    return { skipped: false, ok: false, mechanism: 'requests', status: requestRes.status };
  }
  return { skipped: false, ok: true, mechanism: 'requests', status: requestRes.status };
};

const assertApiReachable = async () => {
  try {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      console.error(`[p5:slo-smoke] FAILED — ${baseUrl}/health returned HTTP ${res.status}`);
      process.exit(1);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[p5:slo-smoke] FAILED — cannot reach ${baseUrl}/health (${detail})`);
    console.error(
      '[p5:slo-smoke] Start the API (e.g. npm run dev:api or docker compose up api) and set BASE_URL if not http://localhost:4000'
    );
    process.exit(1);
  }
};

const runPreflight = () => {
  const program = JSON.parse(readFileSync(join(ROOT, 'scripts/refactor-program.json'), 'utf8'));
  const preDeploy = readFileSync(join(ROOT, 'docs/PRE_DEPLOY_CHECKLIST.md'), 'utf8');
  const smoke = readFileSync(join(ROOT, 'scripts/p5-slo-smoke.mjs'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const p5 = (program.phases ?? []).find((phase) => phase.id === 'P5');
  const sloIds = (p5?.slos ?? []).map((slo) => slo.id);
  const missingSlos = REQUIRED_SLO_IDS.filter((id) => !sloIds.includes(id));
  if (missingSlos.length > 0) {
    console.error(`[p5:slo-smoke] FAILED preflight — slos[] missing ${missingSlos.join(', ')}`);
    process.exit(1);
  }

  const missingChecklist = REQUIRED_SLO_IDS.filter((id) => !preDeploy.includes(id));
  if (missingChecklist.length > 0) {
    console.error(
      `[p5:slo-smoke] FAILED preflight — PRE_DEPLOY missing ${missingChecklist.join(', ')}`
    );
    process.exit(1);
  }

  if (!pkg.scripts?.['p5:slo-smoke']?.includes('p5-slo-smoke')) {
    console.error('[p5:slo-smoke] FAILED preflight — package.json missing p5:slo-smoke');
    process.exit(1);
  }
  if (!pkg.scripts?.['p5:slo-preflight']?.includes('--preflight')) {
    console.error('[p5:slo-smoke] FAILED preflight — package.json missing p5:slo-preflight');
    process.exit(1);
  }

  const coverage = [
    ['SLO-EXPLORE-MAP', '/api/explore/map'],
    ['SLO-EXPLORE-OVERLAY', '/api/me/discover/overlay'],
    ['SLO-JOIN', '/api/activities/${activityId}'],
    ['SLO-JOIN', 'activity_detail_guest'],
    ['SLO-JOIN', '/api/activities/${activityId}/rsvp'],
    ['SLO-JOIN', '/api/activities/${activityId}/requests'],
    ['SLO-JOIN', "note: 'P5 staging join smoke probe'"],
    ['SLO-API-ERR', 'serverErrorRate > 0.001'],
  ];
  const missingCoverage = coverage.filter(([, needle]) => !smoke.includes(needle));
  if (missingCoverage.length > 0) {
    console.error(
      `[p5:slo-smoke] FAILED preflight — smoke missing ${missingCoverage.map((row) => row.join(':')).join(', ')}`
    );
    process.exit(1);
  }

  if (/body:\s*JSON\.stringify\(\{\s*message:/.test(smoke)) {
    console.error('[p5:slo-smoke] FAILED preflight — join body must POST JSON `note`, not `message`');
    process.exit(1);
  }

  console.log(
    `[p5:slo-smoke] preflight OK — ${REQUIRED_SLO_IDS.join(', ')} aligned with slos[] + PRE_DEPLOY (no live API)`
  );
};

const main = async () => {
  if (isPreflight) {
    runPreflight();
    return;
  }

  console.log(`[p5:slo-smoke] BASE_URL=${baseUrl} samples=${samples}`);
  await assertApiReachable();

  const latencyTargets = [
    runSeries({ label: 'health', path: '/health' }),
    runSeries({ label: 'explore_map', path: '/api/explore/map' }),
    runSeries({ label: 'areas_list', path: '/api/areas?page=1&pageSize=10' }),
    runSeries({ label: 'facilities_list', path: '/api/facilities?page=1&pageSize=10' }),
  ];

  if (process.env.P5_EXPLORE_MAP_BBOX === '1') {
    latencyTargets.push(
      runSeries({
        label: 'explore_map_bbox',
        path: `/api/explore/map?bbox=${encodeURIComponent(bboxQuery)}`,
        count4xxAsNonError: true,
      })
    );
  }

  const activityIdForRead =
    process.env.P5_ACTIVITY_ID?.trim() || process.env.P5_JOIN_ACTIVITY_ID?.trim();
  if (activityIdForRead) {
    latencyTargets.push(
      runSeries({
        label: 'activity_detail_guest',
        path: `/api/activities/${activityIdForRead}`,
        count4xxAsNonError: true,
      })
    );
  } else {
    console.log(
      '[p5:slo-smoke] activity_detail_guest skipped — set P5_ACTIVITY_ID or P5_JOIN_ACTIVITY_ID'
    );
  }

  const rows = await Promise.all(latencyTargets);

  let totalSamples = 0;
  let totalServerErrors = 0;
  for (const row of rows) {
    totalSamples += row.samples;
    totalServerErrors += row.serverErrors;
    console.log(
      `[p5:slo-smoke] ${row.label} ${row.path} status=${row.lastStatus} errors=${row.errors}/${row.samples} server5xx=${row.serverErrors} p50=${row.p50Ms}ms p95=${row.p95Ms}ms`
    );
  }

  const serverErrorRate = totalSamples > 0 ? totalServerErrors / totalSamples : 0;
  console.log(
    `[p5:slo-smoke] consumer read server-error rate ${totalServerErrors}/${totalSamples} (${(serverErrorRate * 100).toFixed(2)}%)`
  );

  const hardFail = rows.some((r) => r.errors === r.samples);
  if (hardFail) {
    console.error('[p5:slo-smoke] FAILED — all samples errored for at least one path');
    process.exit(1);
  }

  if (serverErrorRate > 0.001) {
    console.error('[p5:slo-smoke] FAILED — server 5xx rate above 0.1% for this run');
    process.exit(1);
  }

  const overlayEmail = process.env.P5_SMOKE_EMAIL?.trim();
  const overlayPassword = process.env.P5_SMOKE_PASSWORD;
  if (!overlayEmail || !overlayPassword) {
    console.log('[p5:slo-smoke] overlay probe skipped — set P5_SMOKE_EMAIL, P5_SMOKE_PASSWORD');
  } else {
    const accessToken = await loginMember(overlayEmail, overlayPassword);
    const overlayRow = await runSeries({
      label: 'explore_map_overlay',
      path: '/api/me/discover/overlay',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    });
    console.log(
      `[p5:slo-smoke] ${overlayRow.label} ${overlayRow.path} status=${overlayRow.lastStatus} errors=${overlayRow.errors}/${overlayRow.samples} server5xx=${overlayRow.serverErrors} p50=${overlayRow.p50Ms}ms p95=${overlayRow.p95Ms}ms`
    );
    if (overlayRow.errors === overlayRow.samples || overlayRow.serverErrors > 0) {
      console.error('[p5:slo-smoke] FAILED — overlay probe did not succeed');
      process.exit(1);
    }
  }

  const join = await probeJoinPath();
  if (join.skipped === false && join.ok === false) {
    console.error('[p5:slo-smoke] FAILED — join probe did not succeed');
    process.exit(1);
  }

  console.log('[p5:slo-smoke] OK — record p95 + join result in staging notes before prod promote');
};

main().catch((err) => {
  console.error('[p5:slo-smoke] FAILED', err);
  process.exit(1);
});
