import { describe, expect, it, vi } from 'vitest';
import {
  refreshFailureShouldInvalidateSession,
  runTokenRefreshWithRetry,
  type TokenRefreshOutcome,
} from './authSessionRefresh';

describe('refreshFailureShouldInvalidateSession', () => {
  it('invalidates only on auth rejection statuses', () => {
    expect(refreshFailureShouldInvalidateSession(401)).toBe(true);
    expect(refreshFailureShouldInvalidateSession(403)).toBe(true);
    expect(refreshFailureShouldInvalidateSession(500)).toBe(false);
    expect(refreshFailureShouldInvalidateSession(502)).toBe(false);
    expect(refreshFailureShouldInvalidateSession(503)).toBe(false);
  });
});

describe('runTokenRefreshWithRetry', () => {
  it('returns ok without further retries', async () => {
    const attempt = vi.fn(async (): Promise<TokenRefreshOutcome> => ({
      status: 'ok',
      session: { accessToken: 'tok' },
    }));
    const result = await runTokenRefreshWithRetry(attempt, [0, 10, 10]);
    expect(result).toEqual({ status: 'ok', session: { accessToken: 'tok' } });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('stops immediately on unauthorized', async () => {
    const attempt = vi.fn(async (): Promise<TokenRefreshOutcome> => ({ status: 'unauthorized' }));
    const result = await runTokenRefreshWithRetry(attempt, [0, 10, 10]);
    expect(result).toEqual({ status: 'unauthorized' });
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures then returns transient', async () => {
    const attempt = vi.fn(async (): Promise<TokenRefreshOutcome> => ({ status: 'transient' }));
    const result = await runTokenRefreshWithRetry(attempt, [0, 5, 5]);
    expect(result).toEqual({ status: 'transient' });
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('recovers after transient then ok (API came back)', async () => {
    const attempt = vi
      .fn(async (): Promise<TokenRefreshOutcome> => ({ status: 'transient' }))
      .mockResolvedValueOnce({ status: 'transient' })
      .mockResolvedValueOnce({ status: 'ok', session: { accessToken: 'back' } });
    const result = await runTokenRefreshWithRetry(attempt, [0, 5]);
    expect(result).toEqual({ status: 'ok', session: { accessToken: 'back' } });
    expect(attempt).toHaveBeenCalledTimes(2);
  });
});
