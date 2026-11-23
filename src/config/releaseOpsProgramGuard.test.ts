import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const RELEASE_SCRIPTS = [
  'release:ops:checklist',
  's10f:ops:checklist',
  'mig-disco-reg:ops:checklist',
  'p5:slo-preflight',
  'p5:slo-smoke',
  's10e:staging-checklist',
] as const;

const PROGRAM_GUARDS = [
  'p4bS10fProgramGuard.test.ts',
  'p5SloProgramGuard.test.ts',
  'migDiscoRegProgramGuard.test.ts',
  'migPlatformComposeOperatorProgramGuard.test.ts',
  'releaseOpsProgramGuard.test.ts',
] as const;

/**
 * @see scripts/release-staging-ops.mjs · refactor-program.json authorization.statement
 */
describe('releaseOpsProgramGuard (staging release ops spine)', () => {
  it('RELEASE-OPS-01: unified release checklist and per-gate ops scripts exist', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    const missing = RELEASE_SCRIPTS.filter((id) => !pkg.scripts?.[id]);
    expect(missing).toEqual([]);
    expect(pkg.scripts?.['release:ops:checklist']).toMatch(/release-staging-ops/);
    expect(existsSync(join(ROOT, 'scripts/release-staging-ops.mjs'))).toBe(true);
  });

  it('RELEASE-OPS-02: release runner delegates to S10f and MIG-DISCO-REG checklists', () => {
    const ops = read('scripts/release-staging-ops.mjs');
    expect(ops).toMatch(/case 'checklist'/);
    expect(ops).toMatch(/s10f:ops:checklist/);
    expect(ops).toMatch(/mig-disco-reg:ops:checklist/);
  });

  it('RELEASE-OPS-03: PRE_DEPLOY and program authorization list the same ops gates', () => {
    const preDeploy = read('docs/PRE_DEPLOY_CHECKLIST.md');
    expect(preDeploy).toMatch(/release:ops:checklist/);
    expect(preDeploy).toMatch(/p5:slo-smoke/);
    expect(preDeploy).toMatch(/s10e:staging-checklist/);
    expect(preDeploy).toMatch(/s10f:ops:print-routes/);
    expect(preDeploy).toMatch(/mig-disco-reg:ops:preflight/);
    const program = JSON.parse(read('scripts/platform-governance.json')) as {
      authorization?: { statement?: string };
    };
    const statement = program.authorization?.statement ?? '';
    expect(statement).toMatch(/S10f/);
    expect(statement).toMatch(/P5 SLO/);
    expect(statement).toMatch(/MIG-DISCO-REG/);
  });

  it('RELEASE-OPS-04: program guards stay in verify:domain:fe bundle', () => {
    const verifyFe = read('scripts/verify-domain-fe.mjs');
    const missing = PROGRAM_GUARDS.filter((g) => !verifyFe.includes(g));
    expect(missing).toEqual([]);
  });
});