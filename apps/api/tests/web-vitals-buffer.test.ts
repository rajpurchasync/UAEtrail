import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  enqueueWebVital,
  resetWebVitalsBufferForTests,
  webVitalsBufferSize,
} from '../src/lib/web-vitals-buffer.js';

describe('webVitalsBuffer', () => {
  beforeEach(() => {
    resetWebVitalsBufferForTests();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    resetWebVitalsBufferForTests();
  });

  it('buffers many samples and flushes one batch', async () => {
    const flush = vi.fn();
    enqueueWebVital({ n: 'LCP', v: 1200, path: '/activity/a' }, flush);
    enqueueWebVital({ n: 'CLS', v: 0.01, path: '/activity/a' }, flush);
    expect(webVitalsBufferSize()).toBe(2);
    expect(flush).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush.mock.calls[0]?.[0]).toHaveLength(2);
    expect(webVitalsBufferSize()).toBe(0);
  });
});
