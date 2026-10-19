import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('user route mount shell', () => {
  it('delegates to register* modules (no fat inline handlers)', () => {
    const user = read('src/routes/user.ts');
    const member = read('src/routes/user/composeUserMemberRoutes.ts');
    const publicRoutes = read('src/routes/user/composeUserPublicRoutes.ts');
    expect(user).toMatch(/composeUserPublicRoutes/);
    expect(user).toMatch(/composeUserMemberRoutes/);
    expect(member).toMatch(/registerMemberDiscoveryRoutes/);
    expect(member).toMatch(/registerProfileRoutes/);
    expect(member).toMatch(/registerMeWishlistRoutes/);
    expect(publicRoutes).toMatch(/registerReviewRoutes/);
    expect(member).toMatch(/registerMeDiscoverOverlayRoutes/);
    expect(user).not.toMatch(/userRouter\.(post|patch|delete)\(['"]\/me\//);
  });

  it('orders public compose before auth before member compose', () => {
    const user = read('src/routes/user.ts');
    const publicIdx = user.indexOf('composeUserPublicRoutes(userRouter');
    const authIdx = user.indexOf('userRouter.use(requireAuth');
    const memberIdx = user.indexOf('composeUserMemberRoutes(userRouter');
    expect(publicIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeGreaterThan(-1);
    expect(memberIdx).toBeGreaterThan(-1);
    expect(publicIdx).toBeLessThan(authIdx);
    expect(memberIdx).toBeGreaterThan(authIdx);
  });

  it('keeps push vapid key as the only public utility route', () => {
    const user = read('src/routes/user.ts');
    const getHandlers = user.match(/userRouter\.get\(/g) ?? [];
    expect(getHandlers.length).toBe(1);
    expect(user).toMatch(/\/push\/vapid-public-key/);
  });
});
