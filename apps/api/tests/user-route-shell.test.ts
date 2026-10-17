import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('user route mount shell', () => {
  it('delegates to register* modules (no fat inline handlers)', () => {
    const user = read('src/routes/user.ts');
    expect(user).toMatch(/registerMemberDiscoveryRoutes/);
    expect(user).toMatch(/registerProfileRoutes/);
    expect(user).toMatch(/registerMeWishlistRoutes/);
    expect(user).toMatch(/registerReviewRoutes/);
    expect(user).toMatch(/registerMeDiscoverOverlayRoutes/);
    expect(user).not.toMatch(/userRouter\.(post|patch|delete)\(['"]\/me\//);
  });

  it('keeps push vapid key as the only public utility route', () => {
    const user = read('src/routes/user.ts');
    const getHandlers = user.match(/userRouter\.get\(/g) ?? [];
    expect(getHandlers.length).toBe(1);
    expect(user).toMatch(/\/push\/vapid-public-key/);
  });
});
