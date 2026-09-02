import { describe, expect, it } from 'vitest';

describe('jwt helpers', () => {
  it('signs and verifies access tokens', async () => {
    const { signAccessToken, verifyAccessToken } = await import('../src/lib/jwt.js');
    const token = signAccessToken({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'participant'
    });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('participant');
  });
});
