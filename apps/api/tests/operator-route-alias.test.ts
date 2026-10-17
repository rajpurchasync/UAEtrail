import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('operator API route mount', () => {
  it('mounts publishing workspace on /publishing with /operator alias', () => {
    const index = readFileSync(join(process.cwd(), 'src/routes/index.ts'), 'utf8');
    expect(index).toMatch(/apiRouter\.use\('\/publishing', operatorRouter\)/);
    expect(index).toMatch(/apiRouter\.use\('\/operator', operatorRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/host'/);
    expect(index).not.toMatch(/legacyHostApiRewrite/);
  });
});
