import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('publishing API route mount', () => {
  it('mounts publishing workspace on /publishing only (no /operator HTTP alias)', () => {
    const index = readFileSync(join(process.cwd(), 'src/routes/index.ts'), 'utf8');
    expect(index).toMatch(/apiRouter\.use\('\/publishing', publishingRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/operator', publishingRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/host'/);
    expect(index).not.toMatch(/legacyHostApiRewrite/);
  });
});
