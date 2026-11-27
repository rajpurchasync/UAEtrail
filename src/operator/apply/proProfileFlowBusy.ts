export type ProProfileFlowBusy =
  | { kind: 'idle' }
  | { kind: 'prefilling' }
  | { kind: 'submitting' };

export const PRO_PROFILE_FLOW_BUSY_IDLE: ProProfileFlowBusy = { kind: 'idle' };

export const proProfileFlowIsPrefilling = (busy: ProProfileFlowBusy): boolean =>
  busy.kind === 'prefilling';

export const proProfileFlowIsSubmitting = (busy: ProProfileFlowBusy): boolean =>
  busy.kind === 'submitting';