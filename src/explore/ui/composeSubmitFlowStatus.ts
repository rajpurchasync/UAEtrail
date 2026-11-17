/** Generic compose wizard submit outcome (hosting, availability, add-on-map, …). */
export type ComposeSubmitFlowStatus<TResult> =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'submitted'; result: TResult };

export const COMPOSE_SUBMIT_FLOW_IDLE: ComposeSubmitFlowStatus<never> = { kind: 'idle' };

export const composeSubmitFlowIsSubmitting = <T>(
  status: ComposeSubmitFlowStatus<T>
): boolean => status.kind === 'submitting';

export const composeSubmitFlowResult = <T>(
  status: ComposeSubmitFlowStatus<T>
): T | null => (status.kind === 'submitted' ? status.result : null);

export const composeSubmitFlowBlocksSessionPersist = <T>(
  status: ComposeSubmitFlowStatus<T>
): boolean => status.kind === 'submitted';