import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('member goals contract', () => {
  it('registers goals routes on user router', () => {
    const userRoutes = readFileSync(join(process.cwd(), 'src/routes/user.ts'), 'utf8');
    expect(userRoutes).toMatch(/registerMeGoalsRoutes\(userRouter\)/);
  });

  it('documents goals paths in OpenAPI', () => {
    const openapi = readFileSync(join(process.cwd(), 'src/openapi.ts'), 'utf8');
    expect(openapi).toMatch(/['"]\/me\/goals['"]/);
    expect(openapi).toMatch(/['"]\/me\/goals\/active['"]/);
  });
});
