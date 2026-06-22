import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/redis.js', () => ({
  getRedisClient: vi.fn(async () => null)
}));

const { prisma } = await import('../src/lib/prisma.js');
const { resetLastActiveThrottleForTests, touchLastActive } = await import('../src/lib/user-activity.js');

describe('touchLastActive', () => {
  beforeEach(() => {
    resetLastActiveThrottleForTests();
    vi.spyOn(prisma.user, 'update').mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists activity once within the throttle window', async () => {
    await touchLastActive('user-1');
    await touchLastActive('user-1');

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { lastActiveAt: expect.any(Date) }
    });
  });

  it('persists again after the throttle window elapses', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(301_000);

    await touchLastActive('user-2');
    await touchLastActive('user-2');

    expect(prisma.user.update).toHaveBeenCalledTimes(2);
    nowSpy.mockRestore();
  });
});
