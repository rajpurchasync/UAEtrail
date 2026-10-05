import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('admin route registrars', () => {
  it('host applications live in dedicated registrar', () => {
    const admin = read('src/routes/admin.ts');
    const registrar = read('src/routes/admin/registerAdminHostApplicationRoutes.ts');
    expect(admin).toMatch(/registerAdminHostApplicationRoutes/);
    expect(admin).not.toMatch(/\/host-applications/);
    expect(registrar).toMatch(/\/host-applications/);
  });
});
