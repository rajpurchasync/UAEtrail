/**
 * Durable side effects (notifications, explore map cache bust).
 * Production: on by default (`NODE_ENV=production`). Set `SIDE_EFFECT_OUTBOX=0` only in tests.
 * Non-production: opt-in with `SIDE_EFFECT_OUTBOX=1`.
 */
export const isSideEffectOutboxEnabled = (): boolean => {
  const raw = process.env.SIDE_EFFECT_OUTBOX?.trim();
  if (raw === '0') return false;
  if (process.env.NODE_ENV === 'production') return true;
  return raw === '1';
};
