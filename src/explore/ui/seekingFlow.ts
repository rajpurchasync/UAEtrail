/**
 * Plan → **seeking** wizard (`participant_intents`).
 * Engine: `seekingFlowEngine.ts` (`demandFlow.ts` re-exports for legacy imports).
 */

export type {
  DemandKind as SeekingPlanKind,
  DemandFlowStepId as SeekingFlowStepId,
  DemandDraft as SeekingActivityDraft,
} from './seekingFlowEngine';

export {
  emptyDemandDraft as emptySeekingDraft,
  getDemandFlowSteps as getSeekingFlowSteps,
  validateDemandStep as validateSeekingStep,
  DEMAND_TYPE_OPTIONS as SEEKING_TYPE_OPTIONS,
} from './seekingFlowEngine';
