/** One database ping shared by every readiness check inside `ttlMs`. */
export const createReadinessGate = (ping: () => Promise<void>, ttlMs: number) => {
  let readyUntil = 0;
  let inflight: Promise<void> | null = null;

  return async (now = Date.now()): Promise<void> => {
    if (now < readyUntil) return;
    if (!inflight) {
      const pending = ping()
        .then(() => {
          readyUntil = now + ttlMs;
        })
        .finally(() => {
          if (inflight === pending) inflight = null;
        });
      inflight = pending;
    }
    await inflight;
  };
};
