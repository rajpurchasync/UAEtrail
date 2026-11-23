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
  const program = JSON.parse(read('scripts/platform-program.json')) as {
    phases?: Phase[];
    migrations?: { id: string; phase?: string; status: string }[];
  };

  it('PHASE-OPS-01: P4b eng closed; all P4b migrations complete', () => {
    const p4b = program.phases?.find((p) => p.id === 'P4b');
    expect(p4b?.engineeringStatus).toBe('complete');
    expect((p4b?.opsGatesPending ?? []).length).toBeGreaterThan(0);
    expect(p4b?.status).toBe('in_progress');
    const open = (program.migrations ?? []).filter((m) => m.phase === 'P4b' && m.status !== 'complete');
    expect(open).toEqual([]);
  });

  it('PHASE-OPS-02: P5 eng closed; MIG-P5-SLO-SMOKE migration complete', () => {
    const p5 = program.phases?.find((p) => p.id === 'P5');
    expect(p5?.engineeringStatus).toBe('complete');
    expect((p5?.opsGatesPending ?? []).length).toBeGreaterThan(0);
    expect(p5?.status).toBe('in_progress');
    const mig = program.migrations?.find((m) => m.id === 'MIG-P5-SLO-SMOKE');
    expect(mig?.status).toBe('complete');
  });

  it('PHASE-OPS-03: PRE_DEPLOY documents pending ops gates', () => {
    const pre = read('docs/PRE_DEPLOY_CHECKLIST.md');
    expect(pre).toMatch(/s10f:ops/);
    expect(pre).toMatch(/p5:slo-smoke/);
  });
});