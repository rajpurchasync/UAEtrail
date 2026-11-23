import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('platformProgramNamingGuard (post-refactor index)', () => {
  it('PGM-NAME-01: platform-program.json is the sole program index', () => {
    expect(existsSync(join(ROOT, 'scripts/platform-program.json'))).toBe(true);
    expect(existsSync(join(ROOT, 'scripts/refactor-program.json'))).toBe(false);
    const program = JSON.parse(readFileSync(join(ROOT, 'scripts/platform-program.json'), 'utf8'));
    expect(program.description).toMatch(/not an active refactor backlog/i);
    expect(program.archivePolicy).toMatch(/touchpoints/i);
  });

  it('PGM-NAME-02: verify script and npm gate use platform-program naming', () => {
    expect(existsSync(join(ROOT, 'scripts/verify-platform-program.mjs'))).toBe(true);
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['verify:platform-program']).toMatch(/verify-platform-program/);
    expect(pkg.scripts?.['verify:refactor-program']).toBeUndefined();
  });
});