import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('operator route mount shell', () => {
  it('delegates to registerOperator* modules only', () => {
    const operator = read('src/routes/operator.ts');
    expect(operator).toMatch(/registerOperatorSubmittedLocationRoutes/);
    expect(operator).toMatch(/registerOperatorActivityRoutes/);
    expect(operator).not.toMatch(/registerHost/);
    expect(operator).not.toMatch(/operatorRouter\.(get|post|patch|delete)\(/);
  });

  it('does not ship a parallel routes/host mount shell', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/host.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/routes/host'))).toBe(false);
  });
});
