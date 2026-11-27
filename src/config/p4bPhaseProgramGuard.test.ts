import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/**
 * P4b surface program — eng migrations closed; phase stays open until S10f ops sign-off.
 * @see platform-governance.json phases[].P4b · releaseOpsProgramGuard
 */
describe('p4bPhaseProgramGuard (P4b phase eng closure)', () => {
  it('P4B-PHASE-01: P4b engineering closed in platform-governance', () => {
    const program = JSON.parse(read('scripts/governance/platform-governance.json')) as {
      phases?: { id: string; engineeringStatus?: string; status?: string }[];
    };
    const p4b = program.phases?.find((p) => p.id === 'P4b');
    expect(p4b?.engineeringStatus).toBe('complete');
    expect(p4b?.status).toBe('in_progress');
  });

  it('P4B-PHASE-02: P4b exit criteria reference S10f ops and verify:system', () => {
    const program = JSON.parse(read('scripts/governance/platform-governance.json')) as {
      phases?: { id: string; exitCriteria?: string[] }[];
    };
    const p4b = program.phases?.find((p) => p.id === 'P4b');
    const criteria = (p4b?.exitCriteria ?? []).join('\n');
    expect(criteria).toMatch(/s10f:ops:print-routes/);
    expect(criteria).toMatch(/MIG-SURFACE-\*/);
    expect(criteria).toMatch(/npm run verify:system/);
  });

  it('P4B-PHASE-03: Tier-1 QA docs use S10f ops commands (not legacy-only)', () => {
    for (const rel of ['docs/NAVIGATION.md', 'docs/DOCS_INDEX.md', 'docs/PRE_DEPLOY_CHECKLIST.md']) {
      const body = read(rel);
      expect(body).toMatch(/s10f:ops/);
    }
    expect(read('docs/DOCS_INDEX.md')).toMatch(/release:ops:checklist|s10f:ops:print-routes/);
  });

  it('P4B-PHASE-04: guard wired in verify:domain:fe', () => {
    const verifyFe = read('scripts/verify/domain-fe-vitest-files.mjs');
    expect(verifyFe).toMatch(/p4bPhaseProgramGuard\.test\.ts/);
    expect(verifyFe).toMatch(/p4bS10fProgramGuard\.test\.ts/);
    expect(verifyFe).toMatch(/releaseOpsProgramGuard\.test\.ts/);
  });
});