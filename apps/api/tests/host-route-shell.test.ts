import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('host route mount shell', () => {
  it('delegates to register* modules only', () => {
    const host = read('src/routes/host.ts');
    expect(host).toMatch(/registerHostSubmittedLocationRoutes/);
    expect(host).toMatch(/registerHostTenantActivityRoutes/);
    expect(host).not.toMatch(/hostRouter\.(get|post|patch|delete)\(/);
  });
});
