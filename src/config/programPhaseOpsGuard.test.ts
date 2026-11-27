import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

type Phase = {
  id: string;
  status: string;
  engineeringStatus?: string;
  opsGatesPending?: string[];
};

/**
 * P4b / P5 stay in_progress until human ops sign-off — engineering work is closed in-repo.
 */
describe('programPhaseOpsGuard (P4b · P5 ops vs eng)', () => {
  const governance = JSON.parse(read('scripts/governance/platform-governance.json')) as { phases?: Phase[] };
  it('PHASE-OPS-01: P4b eng closed; ops gates still open', () => {
    const p4b = governance.phases?.find((p) => p.id === 'P4b');
    expect(p4b?.engineeringStatus).toBe('complete');
    expect((p4b?.opsGatesPending ?? []).length).toBeGreaterThan(0);
    expect(p4b?.status).toBe('in_progress');
  });

  it('PHASE-OPS-02: P5 eng closed; ops gates still open', () => {
    const p5 = governance.phases?.find((p) => p.id === 'P5');
    expect(p5?.engineeringStatus).toBe('complete');
    expect((p5?.opsGatesPending ?? []).length).toBeGreaterThan(0);
    expect(p5?.status).toBe('in_progress');
    expect(read('src/config/p5SloProgramGuard.test.ts')).toMatch(/P5-SLO/);
  });

  it('PHASE-OPS-03: PRE_DEPLOY documents pending ops gates', () => {
    const pre = read('docs/PRE_DEPLOY_CHECKLIST.md');
    expect(pre).toMatch(/s10f:ops/);
    expect(pre).toMatch(/p5:slo-smoke/);
  });
});