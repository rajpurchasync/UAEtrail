import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('platformProgramNamingGuard (GW-4 governance spine)', () => {
  it('PGM-NAME-01: platform-governance is the ops index; no legacy program json', () => {
    expect(existsSync(join(ROOT, 'scripts/governance/platform-governance.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-migration-archive.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/governance/platform-touchpoint-registry.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/platform-program.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'scripts/refactor-program.json'))).toBe(false);
    const governance = JSON.parse(readFileSync(join(ROOT, 'scripts/governance/platform-governance.json'), 'utf8'));
    expect(governance.description).toMatch(/not an active refactor backlog/i);
    expect(governance.archivePolicy).toMatch(/touchpoint-registry/i);
  });

  it('PGM-NAME-02: verify script and npm gate use platform-governance naming', () => {
    expect(existsSync(join(ROOT, 'scripts/verify/verify-platform-governance.mjs'))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['verify:platform-governance']).toMatch(/verify-platform-governance/);
    expect(pkg.scripts?.['verify:platform-program']).toBeUndefined();
    expect(pkg.scripts?.['verify:refactor-program']).toBeUndefined();
    expect(pkg.scripts?.['program:compact-ledger']).toBeUndefined();
  });
});