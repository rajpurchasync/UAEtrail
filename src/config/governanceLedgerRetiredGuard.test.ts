import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

describe('governanceLedgerRetiredGuard (no closed MIG archive)', () => {
  it('LEDGER-00: closed migration archive must not return', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/platform-migration-archive.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/governance/discover-recommendations-touchpoints.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-layer-spine-touchpoints.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/governance/people-vocabulary-touchpoints.json'))).toBe(false);
  });

  it('LEDGER-01: platform-governance spine files remain', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/platform-governance.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-touchpoint-registry.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/bounded-context-manifest.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/platform-program.json'))).toBe(false);
  });

  it('LEDGER-02: archivePolicy does not require migration ledger file', () => {
    const governance = JSON.parse(read('scripts/governance/platform-governance.json')) as { archivePolicy?: string };
    expect(governance.archivePolicy).toMatch(/touchpoint-registry|bounded-context-manifest/i);
    expect(governance.archivePolicy ?? '').not.toMatch(/platform-migration-archive/i);
  });

  it('LEDGER-03: verify-platform-governance does not require migration archive', () => {
    const script = read('scripts/verify/verify-platform-governance.mjs');
    expect(script).toMatch(/platform-migration-archive\.json must not exist/);
  });
});