/** When `SIDE_EFFECT_OUTBOX=1`, notifications persist to outbox before dispatch (MIG-OUTBOX). */
export const isSideEffectOutboxEnabled = (): boolean =>
  process.env.SIDE_EFFECT_OUTBOX?.trim() === '1';
