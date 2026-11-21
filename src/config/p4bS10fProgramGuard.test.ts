import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const OPS_SCRIPTS = ['consumer-detail:qa-routes', 's10f:qa-checklist', 's10f:ops:checklist'] as const;

const S10F_GUARD_FILES = [
  'src/config/consumerDetailQaMatrixGuard.test.ts',
  'src/config/activityDetailS10fBridgeGuard.test.ts',
  'src/config/participationPresentationGuard.test.ts',
  'src/activity/activityDetailAcceptance.test.ts',
] as const;

/**
 * @see MIG-SURFACE-ACTIVITY-DETAIL · docs/SYSTEM_COHERENCE.md S9/S10f
 */
describe('p4bS10fProgramGuard (P4b S10f ops)', () => {
  it('S10F-OPS-01: npm scripts wire QA routes and ops checklist', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    const missing = OPS_SCRIPTS.filter((id) => !pkg.scripts?.[id]);
    expect(missing).toEqual([]);
    expect(pkg.scripts?.['s10f:ops:checklist']).toMatch(/s10f-staging-ops/);
    expect(pkg.scripts?.['consumer-detail:qa-routes']).toMatch(/consumer-detail-manual-qa-routes/);
  });

  it('S10F-OPS-02: staging ops runner and manual QA script document S10f', () => {
    const ops = read('scripts/s10f-staging-ops.mjs');
    expect(ops).toMatch(/case 'checklist'/);
    expect(ops).toMatch(/consumer-detail:qa-routes/);
    const routes = read('scripts/consumer-detail-manual-qa-routes.mjs');
    expect(routes).toMatch(/consumerDetailQaMatrixGuard/);
    expect(routes).toMatch(/S10f/);
    const preDeploy = read('docs/PRE_DEPLOY_CHECKLIST.md');
    expect(preDeploy).toMatch(/s10f:ops:print-routes/);
    expect(preDeploy).toMatch(/S10f/);
  });

  it('S10F-OPS-03: activity-detail migration complete and core guard files exist', () => {
    const program = JSON.parse(read('scripts/refactor-program.json')) as {
      migrations?: { id: string; status: string }[];
    };
    const mig = program.migrations?.find((m) => m.id === 'MIG-SURFACE-ACTIVITY-DETAIL');
    expect(mig?.status).toBe('complete');
    for (const rel of S10F_GUARD_FILES) {
      expect(existsSync(join(ROOT, rel))).toBe(true);
    }
  });

  it('S10F-OPS-04: S10f guards stay in verify:domain:fe vitest bundle', () => {
    const verifyFe = read('scripts/verify-domain-fe.mjs');
    expect(verifyFe).toMatch(/p4bS10fProgramGuard\.test\.ts/);
    expect(verifyFe).toMatch(/activityDetailS10fBridgeGuard\.test\.ts/);
    expect(verifyFe).toMatch(/consumerDetailQaMatrixGuard\.test\.ts/);
    expect(verifyFe).toMatch(/participationPresentationGuard\.test\.ts/);
  });
});