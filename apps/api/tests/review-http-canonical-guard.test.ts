import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string): string =>
  readFileSync(resolve(import.meta.dirname, '..', relativePath), 'utf8');

describe('review HTTP canonical (COH-09)', () => {
  it('registers reviews on the user router before requireAuth', () => {
    expect(existsSync(resolve(import.meta.dirname, '../src/routes/social.ts'))).toBe(false);
    expect(
      existsSync(resolve(import.meta.dirname, '../src/routes/social/registerSocialReviewRoutes.ts'))
    ).toBe(false);

    const user = read('src/routes/user.ts');
    const reviewIdx = user.indexOf('registerReviewRoutes(userRouter)');
    const authIdx = user.indexOf('userRouter.use(requireAuth');
    expect(reviewIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeGreaterThan(reviewIdx);

    const registrar = read('src/routes/user/registerReviewRoutes.ts');
    expect(registrar).toMatch(/\/reviews'/);
    expect(registrar).toMatch(/\/me\/reviews'/);
    expect(registrar).toMatch(/activity/);
    const reviewCommands = read('src/services/review-commands.ts');
    expect(reviewCommands).toMatch(/assertViewerCanReviewActivity/);
  });

  it('defines ACTIVITY review target in domain enums', () => {
    const enums = read('src/domain/enums.ts');
    expect(enums).toMatch(/ACTIVITY:\s*'ACTIVITY'/);
  });
});
