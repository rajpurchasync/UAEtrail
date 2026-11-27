import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const OPS_SCRIPTS = [
  'seeking:storage-status',
  'seeking:deploy-gate',
  'mig-disco-reg:ops:preflight',
  'mig-disco-reg:ops:migrate',
  'mig-disco-reg:ops:gate',
  'mig-disco-reg:ops:checklist',
] as const;

/**
 * @see MIG-DISCO-REG · docs/operations/SEEKING_STORAGE_RUNBOOK.md
 */
describe('migDiscoRegProgramGuard (MIG-DISCO-REG ops)', () => {
  it('DISCO-REG-01: npm scripts wire storage status, migrate, and gate', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    const missing = OPS_SCRIPTS.filter((id) => !pkg.scripts?.[id]);
    expect(missing).toEqual([]);
    expect(pkg.scripts?.['seeking:deploy-gate']).toMatch(/seeking:storage-status.*--strict/);
  });

  it('DISCO-REG-02: staging ops runner documents runbook steps', () => {
    const ops = read('scripts/ops/mig-disco-reg-staging-ops.mjs');
    expect(ops).toMatch(/migrate-seeking-to-availability/);
    expect(ops).toMatch(/seeking:deploy-gate/);
    expect(ops).toMatch(/case 'checklist'/);
    const runbook = read('docs/operations/SEEKING_STORAGE_RUNBOOK.md');
    expect(runbook).toMatch(/mig-disco-reg:ops:gate/);
    expect(runbook).toMatch(/member_availability/);
  });

  it('DISCO-REG-03: API migrate script exists and DISCO-REG migration row is in program', () => {
    expect(existsSync(join(ROOT, 'apps/api/scripts/migrate-seeking-to-availability.ts'))).toBe(true);
    const apiPkg = JSON.parse(read('apps/api/package.json')) as { scripts?: Record<string, string> };
    expect(apiPkg.scripts?.['migrate-seeking-to-availability']).toBeTruthy();
    expect(
      JSON.parse(read('scripts/governance/platform-migration-archive.json')).migrations?.some(
        (m: { id: string }) => m.id === 'MIG-DISCO-REG'
      )
    ).toBe(true);
  });

  it('DISCO-REG-04: seek residue API guards stay in verify:domain:api', () => {
    const verifyApi = read('scripts/verify/verify-domain-api.mjs');
    expect(verifyApi).toMatch(/participant-intent-residue-guard\.test\.ts/);
    expect(verifyApi).toMatch(/explore-seeking-activities-contract\.test\.ts/);
    expect(verifyApi).toMatch(/seeking-storage-ops-contract\.test\.ts/);
  });

  it('DISCO-REG-05 (MIG-SG-B4): availability discovery reads project from slots', () => {
    expect(existsSync(join(ROOT, 'packages/shared-types/src/availability-discovery-projection.ts'))).toBe(
      true
    );
    const index = read('packages/shared-types/src/index.ts');
    expect(index).toMatch(/availability-discovery-projection/);
    const store = read('apps/api/src/lib/member-availability-store.ts');
    expect(store).toMatch(/personMatchesAvailabilityKindQuery/);
    expect(store).not.toMatch(/kinds:\s*query\.kind/);
    expect(read('src/crew-discovery/panel/crewBrowse/CrewBrowseTabContent.tsx')).toMatch(
      /filterAvailabilityByCapacity/
    );
  });
});