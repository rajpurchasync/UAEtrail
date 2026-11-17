import type { AvailabilityFixedSubmitResult } from './availabilityFlowEngine';

/** Fixed “find a group” wizard — submit outcome (draft/step state stays separate). */
export type AvailabilityFixedSubmitFlowStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'submitted'; result: AvailabilityFixedSubmitResult };

export const AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE: AvailabilityFixedSubmitFlowStatus = {
  kind: 'idle',
};

export const availabilityFixedSubmitFlowIsSubmitting = (
  status: AvailabilityFixedSubmitFlowStatus
): boolean => status.kind === 'submitting';

export const availabilityFixedSubmitFlowResult = (
  status: AvailabilityFixedSubmitFlowStatus
): AvailabilityFixedSubmitResult | null =>
  status.kind === 'submitted' ? status.result : null;

export const availabilityFixedSubmitFlowBlocksSessionPersist = (
  status: AvailabilityFixedSubmitFlowStatus
): boolean => status.kind === 'submitted';