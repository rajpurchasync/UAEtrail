import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string): string =>
  readFileSync(resolve(import.meta.dirname, '..', relativePath), 'utf8');

describe('social review API contract', () => {
  it('registers reviews on legacy social router via registrar', () => {
    const social = read('src/routes/social.ts');
    expect(social).toMatch(/registerSocialReviewRoutes\(socialRouter\)/);
    expect(social).not.toMatch(/socialRouter\.post\('\/reviews'/);

    const registrar = read('src/routes/social/registerSocialReviewRoutes.ts');
    expect(registrar).toMatch(/\/reviews'/);
    expect(registrar).toMatch(/\/me\/reviews'/);
    expect(registrar).toMatch(/activity/);
    expect(registrar).toMatch(/assertViewerCanReviewActivity/);
  });

  it('defines ACTIVITY review target in domain enums', () => {
    const enums = read('src/domain/enums.ts');
    expect(enums).toMatch(/ACTIVITY:\s*'ACTIVITY'/);
  });
});
