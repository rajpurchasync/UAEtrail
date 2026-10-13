#!/usr/bin/env node
/**
 * Local S10e helper: compare full explore map payload vs a viewport bbox (needs API up).
 * API must run with EXPLORE_MAP_VNEXT=1 or bbox requests return 400 explore_map_vnext_disabled.
 *
 * Usage:
 *   EXPLORE_MAP_VNEXT=1 npm run dev:api   # separate terminal
 *   npm run s10e:local-ratio
 *
 * Env: API_BASE_URL (default http://localhost:3000), BBOX (default 54.9,24.9,55.5,25.5), LIMIT (default 200)
 */
const apiBase = (process.env.API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const bbox = process.env.BBOX || '54.9,24.9,55.5,25.5';
const limit = process.env.LIMIT || '200';
const targetRatio = Number(process.env.VNEXT_TARGET_RATIO || '0.4');

const fullUrl = `${apiBase}/api/v1/explore/map`;
const bboxUrl = `${apiBase}/api/v1/explore/map?bbox=${encodeURIComponent(bbox)}&limit=${limit}`;

const byteLength = async (url) => {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    if (!res.ok) {
      let code;
      try {
        code = JSON.parse(text)?.error?.code;
      } catch {
        /* ignore */
      }
      return { ok: false, status: res.status, code, bytes: text.length, url };
    }
    return { ok: true, status: res.status, bytes: text.length, url };
  } catch (err) {
    return {
      ok: false,
      networkError: err instanceof Error ? err.message : String(err),
      url,
    };
  }
};

const failApiUnreachable = (detail) => {
  console.error(detail);
  console.error('Start API: EXPLORE_MAP_VNEXT=1 npm run dev:api');
  process.exit(1);
};

console.log(`# S10e local vNext payload ratio\nAPI_BASE_URL=${apiBase}\n`);

const bboxProbe = await byteLength(bboxUrl);
if (bboxProbe.networkError) {
  failApiUnreachable(`Could not reach API (${bboxProbe.networkError}).`);
}
if (!bboxProbe.ok && bboxProbe.status === 400 && bboxProbe.code === 'explore_map_vnext_disabled') {
  console.error('BBox fetch rejected: explore_map_vnext_disabled.');
  console.error('Restart API with: EXPLORE_MAP_VNEXT=1 npm run dev:api');
  process.exit(1);
}

const full = await byteLength(fullUrl);
if (full.networkError) {
  failApiUnreachable(`Could not reach API (${full.networkError}).`);
}

if (!full.ok) {
  console.error(`Full map failed: ${full.status} ${full.url}`);
  process.exit(1);
}

if (!bboxProbe.ok) {
  console.error(`BBox map failed: ${bboxProbe.status} ${bboxProbe.url} (code=${bboxProbe.code ?? 'n/a'})`);
  process.exit(1);
}

const ratio = full.bytes > 0 ? bboxProbe.bytes / full.bytes : 0;
const pass = ratio < targetRatio;

console.log(`Full map:  ${full.bytes.toLocaleString()} bytes`);
console.log(`BBox map:  ${bboxProbe.bytes.toLocaleString()} bytes  (bbox=${bbox}, limit=${limit})`);
console.log(`Ratio:     ${(ratio * 100).toFixed(1)}%  (target < ${(targetRatio * 100).toFixed(0)}% for promotion gate)`);
console.log(pass ? '\nOK for local ratio spot-check (staging p95 still required).' : '\nWARN: ratio above target — tune bbox/limit or catalog; not a production promote signal alone.');

process.exit(pass ? 0 : 2);
