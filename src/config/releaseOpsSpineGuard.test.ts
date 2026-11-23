import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('releaseOpsSpineGuard (DMCP Phase 8)', () => {
  it('RELEASE-SPINE-01: unified release ops checklist wired', () => {
    expect(read('package.json')).toMatch(/release:ops:checklist/);
    expect(existsSync(join(process.cwd(), 'scripts/release-staging-ops.mjs'))).toBe(true);
    expect(read('src/config/releaseOpsProgramGuard.test.ts')).toMatch(/RELEASE-OPS-01/);
  });

  it('RELEASE-SPINE-02: S10f · P5 SLO · MIG-DISCO-REG ops scripts present', () => {
    const pkg = JSON.parse(read('package.json'));
    for (const id of [
      's10f:ops:checklist',
      'p5:slo-preflight',
      'p5:slo-smoke',
      'mig-disco-reg:ops:checklist',
      's10e:staging-checklist',
    ]) {
      expect(pkg.scripts?.[id], id).toBeTruthy();
    }
  });

  it('RELEASE-SPINE-03: program guards roll up in verify-release-ops', () => {
    expect(read('package.json')).toMatch(/verify:release-ops/);
    expect(existsSync(join(process.cwd(), 'scripts/verify-release-ops.mjs'))).toBe(true);
    expect(read('scripts/verify-domain-fe.mjs')).toMatch(/releaseOpsSpineGuard\.test\.ts/);
  });

  it('RELEASE-SPINE-04: PRE_DEPLOY lists same gates as refactor-program authorization', () => {
    const preDeploy = read('docs/PRE_DEPLOY_CHECKLIST.md');
    expect(preDeploy).toMatch(/release:ops:checklist/);
    const program = JSON.parse(read('scripts/platform-program.json'));
    expect(program.authorization?.statement).toMatch(/MIG-DISCO-REG/);
  });

  it('RELEASE-SPINE-05: dmcpPhase 8', () => {
    expect(JSON.parse(read('scripts/authority-matrix.json')).dmcpPhase).toBe(8);
  });

  it('RELEASE-SPINE-06: DMCP eng marked complete', () => {
    expect(JSON.parse(read('scripts/authority-matrix.json')).dmcpStatus).toBe('complete');
    expect(JSON.parse(read('scripts/platform-program.json')).authorization?.statement).toMatch(/DMCP eng verify complete/);
  });
});