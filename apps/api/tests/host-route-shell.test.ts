import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('publishing route mount shell', () => {
  it('delegates to registerPublishing* modules only', () => {
    const operator = read('src/routes/publishing.ts');
    expect(operator).toMatch(/registerPublishingSubmittedLocationRoutes/);
    expect(operator).toMatch(/registerPublishingActivityRoutes/);
    expect(operator).toMatch(/registerPublishingShopStorefrontRoutes/);
    expect(operator).not.toMatch(/registerHost/);
    expect(operator).not.toMatch(/publishingRouter\.(get|post|patch|delete)\(/);
  });

  it('does not ship a parallel routes/host mount shell', () => {
    expect(existsSync(join(process.cwd(), 'src/routes/host.ts'))).toBe(false);
    expect(existsSync(join(process.cwd(), 'src/routes/host'))).toBe(false);
  });
});
