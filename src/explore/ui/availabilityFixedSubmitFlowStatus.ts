import type { AvailabilityFixedSubmitResult } from './intentFixedFlowEngine';
import {
  COMPOSE_SUBMIT_FLOW_IDLE,
  composeSubmitFlowBlocksSessionPersist,
  composeSubmitFlowIsSubmitting,
  composeSubmitFlowResult,
  type ComposeSubmitFlowStatus,
} from './composeSubmitFlowStatus';

/** Fixed “find a group” wizard — submit outcome (draft/step state stays separate). */
export type AvailabilityFixedSubmitFlowStatus =
  ComposeSubmitFlowStatus<AvailabilityFixedSubmitResult>;

export const AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE: AvailabilityFixedSubmitFlowStatus =
  COMPOSE_SUBMIT_FLOW_IDLE;

export const availabilityFixedSubmitFlowIsSubmitting = composeSubmitFlowIsSubmitting;

export const availabilityFixedSubmitFlowResult = composeSubmitFlowResult;

export const availabilityFixedSubmitFlowBlocksSessionPersist = composeSubmitFlowBlocksSessionPersist;