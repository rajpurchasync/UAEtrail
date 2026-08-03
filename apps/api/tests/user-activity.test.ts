import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authUsers from '../src/lib/auth-users.js';

vi.mock('../src/lib/redis.js', () => ({
  getRedisClient: vi.fn(async () => null)
}));

const { resetLastActiveThrottleForTests, touchLastActive } = await import('../src/lib/user-activity.js');

describe('touchLastActive', () => {
  beforeEach(() => {
    resetLastActiveThrottleForTests();
    vi.spyOn(authUsers, 'updateAuthUserLastActive').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists activity once within the throttle window', async () => {
    await touchLastActive('user-1');
    await touchLastActive('user-1');

    expect(authUsers.updateAuthUserLastActive).toHaveBeenCalledTimes(1);
    expect(authUsers.updateAuthUserLastActive).toHaveBeenCalledWith('user-1');
  });

  it('persists again after the throttle window elapses', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(301_000);

    await touchLastActive('user-2');
    await touchLastActive('user-2');

    expect(authUsers.updateAuthUserLastActive).toHaveBeenCalledTimes(2);
    nowSpy.mockRestore();
  });
});
