import { describe, expect, it, vi } from 'vitest';
import { getOrSetRequestScoped, runWithRequestScope } from '../src/lib/request-scope-cache.js';

describe('request-scope-cache', () => {
  it('dedupes async factories within a request scope', async () => {
    const factory = vi.fn(async () => 42);

    await new Promise<void>((resolve) => {
      runWithRequestScope(() => {
        void Promise.all([getOrSetRequestScoped('k', factory), getOrSetRequestScoped('k', factory)]).then(
          ([a, b]) => {
            expect(a).toBe(42);
            expect(b).toBe(42);
            expect(factory).toHaveBeenCalledTimes(1);
            resolve();
          }
        );
      });
    });
  });

  it('runs factory when outside request scope', async () => {
    const factory = vi.fn(async () => 'ok');
    await expect(getOrSetRequestScoped('k', factory)).resolves.toBe('ok');
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
