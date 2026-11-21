import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const REQUIRED_SLO_IDS = [
  'SLO-EXPLORE-MAP',
  'SLO-EXPLORE-OVERLAY',
  'SLO-JOIN',
  'SLO-API-ERR',
];

/**
 * @see MIG-P5-SLO-SMOKE · scripts/p5-slo-smoke.mjs · docs/PRE_DEPLOY_CHECKLIST.md § SLO baseline
 */
describe('p5SloProgramGuard (MIG-P5-SLO-SMOKE)', () => {
  it('P5-SLO-01: verify:domain runs preflight before API contract tests', () => {
    const verifyApi = read('scripts/verify-domain-api.mjs');
    expect(verifyApi).toMatch(/p5:slo-preflight/);
    const preflightIdx = verifyApi.indexOf('p5:slo-preflight');
    const vitestIdx = verifyApi.indexOf('p5-slo-smoke-probes-contract');
    expect(preflightIdx).toBeGreaterThan(-1);
    expect(vitestIdx).toBeGreaterThan(preflightIdx);
  });

  it('P5-SLO-02: smoke script, package scripts, and migration row exist', () => {
    expect(existsSync(join(ROOT, 'scripts/p5-slo-smoke.mjs'))).toBe(true);
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['p5:slo-smoke']).toMatch(/p5-slo-smoke/);
    expect(pkg.scripts?.['p5:slo-preflight']).toMatch(/--preflight/);
    const program = JSON.parse(read('scripts/refactor-program.json')) as {
      migrations?: { id: string; status: string }[];
    };
    const mig = program.migrations?.find((row) => row.id === 'MIG-P5-SLO-SMOKE');
    expect(mig).toBeTruthy();
  });

  it('P5-SLO-03: P5 slos[] and PRE_DEPLOY checklist list the same SLO ids', () => {
    const program = JSON.parse(read('scripts/refactor-program.json')) as {
      phases?: { id: string; slos?: { id: string }[] }[];
    };
    const p5 = program.phases?.find((phase) => phase.id === 'P5');
    const sloIds = (p5?.slos ?? []).map((slo) => slo.id);
    expect(REQUIRED_SLO_IDS.every((id) => sloIds.includes(id))).toBe(true);
    const preDeploy = read('docs/PRE_DEPLOY_CHECKLIST.md');
    const missing = REQUIRED_SLO_IDS.filter((id) => !preDeploy.includes(id));
    expect(missing).toEqual([]);
  });

  it('P5-SLO-04: probe contract test is in verify:domain:api vitest bundle', () => {
    expect(read('scripts/verify-domain-api.mjs')).toMatch(/p5-slo-smoke-probes-contract\.test\.ts/);
    expect(read('apps/api/tests/p5-slo-smoke-probes-contract.test.ts')).toMatch(/MIG-P5-SLO-SMOKE/);
  });
});