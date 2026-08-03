const isEnabled = (): boolean =>
  process.env.QUERY_TIMING === '1' || process.env.NODE_ENV === 'development' && process.env.QUERY_TIMING !== '0';

export const withQueryTiming = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  if (!isEnabled()) {
    return fn();
  }

  const start = performance.now();
  try {
    return await fn();
  } finally {
    const elapsedMs = performance.now() - start;
    if (elapsedMs >= 25) {
      console.log(`[query-timing] ${label} ${elapsedMs.toFixed(1)}ms`);
    }
  }
};
