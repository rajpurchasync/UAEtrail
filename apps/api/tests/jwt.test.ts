import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/uaetrail';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-test-access-secret';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-test-refresh-secret';
  process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5173';
  process.env.API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
});

describe('jwt helpers', () => {
  it('signs and verifies access tokens', async () => {
    const { signAccessToken, verifyAccessToken } = await import('../src/lib/jwt.js');
    const token = signAccessToken({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'visitor'
    });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('visitor');
  });
});
