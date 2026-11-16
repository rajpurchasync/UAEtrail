import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('migrate-seeking-to-availability (MIG-DISCO-REG ops)', () => {
  it('root ops runner wires preflight, migrate, and gate', () => {
    const ops = readFileSync(join(process.cwd(), '../../scripts/mig-disco-reg-staging-ops.mjs'), 'utf8');
    expect(ops).toMatch(/migrate-seeking-to-availability/);
    expect(ops).toMatch(/seeking:deploy-gate/);
    expect(ops).toMatch(/MIG_DISCO_REG_OPS_CONFIRM/);
  });

  it('runbook documents merge train before branch closure ops', () => {
    const runbook = readFileSync(
      join(process.cwd(), '../../docs/operations/SEEKING_STORAGE_RUNBOOK.md'),
      'utf8'
    );
    expect(runbook).toMatch(/## Merge train to `main`/);
    expect(runbook).toMatch(/mig-disco-reg:ops:gate/);
  });

  it('migrates published seeking activities into member_availability fixed slots', () => {
    const script = read('scripts/migrate-seeking-to-availability.ts');
    expect(script).toMatch(/activityMode: 'seeking'/);
    expect(script).toMatch(/ActivityStatus\.PUBLISHED/);
    expect(script).toMatch(/mergeMemberAvailabilityFixedSlotsMigration/);
    expect(script).toMatch(/scheduleExploreMapCacheInvalidation/);
    expect(script).toMatch(/scheduleKind: 'fixed'/);
    expect(script).toMatch(/--cancel-seeking/);
    expect(script).toMatch(/--dry-run/);
  });
});