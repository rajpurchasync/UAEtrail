/**
 * Plan → **seeking** wizard (seeking activities, `activityMode: seeking`).
 * Engine: `seekingFlowEngine.ts`.
 */

export type {
  SeekingKind,
  SeekingFlowStepId,
  SeekingDraft,
} from './seekingFlowEngine';

export {
  emptySeekingDraft,
  getSeekingFlowSteps,
  validateSeekingStep,
  SEEKING_TYPE_OPTIONS,
} from './seekingFlowEngine';
