import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('member identity routing (MIG-ROUTING-CANON-P2)', () => {
  it('public member registrar mounts /member/:userId/* only', () => {
    const registrar = readFileSync(
      join(ROOT, 'apps/api/src/routes/user/registerPublicMemberRoutes.ts'),
      'utf8'
    );
    expect(registrar).toMatch(/\/member\/:userId\/profile/);
    expect(registrar).toMatch(/\/member\/:userId\/brief/);
    expect(registrar).toMatch(/\/member\/:userId\/upcoming-activities/);
    expect(registrar).not.toMatch(/\/users\/:userId\/public-profile/);
  });

  it('accountApi uses /member for person public profile reads', () => {
    const account = readFileSync(join(ROOT, 'src/api/domains/account.ts'), 'utf8');
    expect(account).toMatch(/\/member\/\$\{userId\}\/profile/);
    expect(account).not.toMatch(/public-profile/);
    expect(account).not.toMatch(/`\/users\/\$\{userId\}\/public-profile/);
  });
});
