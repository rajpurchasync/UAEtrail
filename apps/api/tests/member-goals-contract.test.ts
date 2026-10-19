import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('member goals contract', () => {
  it('registers goals routes on user router', () => {
    const memberCompose = readFileSync(
      join(process.cwd(), 'src/routes/user/composeUserMemberRoutes.ts'),
      'utf8'
    );
    expect(memberCompose).toMatch(/registerMeGoalsRoutes\(userRouter\)/);
  });

  it('documents goals paths in OpenAPI', () => {
    const openapi = readFileSync(join(process.cwd(), 'src/openapi.ts'), 'utf8');
    expect(openapi).toMatch(/['"]\/me\/goals['"]/);
    expect(openapi).toMatch(/['"]\/me\/goals\/active['"]/);
  });
});
