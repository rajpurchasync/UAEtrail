import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('operator workspace API route mount', () => {
  it('mounts operator workspace on /workspace only (no /operator HTTP)', () => {
    const index = readFileSync(join(process.cwd(), 'src/routes/index.ts'), 'utf8');
    expect(index).toMatch(/apiRouter\.use\('\/workspace', workspaceRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/publishing'/);
    expect(index).not.toMatch(/apiRouter\.use\('\/operator', workspaceRouter\)/);
    expect(index).not.toMatch(/apiRouter\.use\('\/host'/);
    expect(index).not.toMatch(/legacyHostApiRewrite/);
  });
});