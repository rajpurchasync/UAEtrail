import { describe, expect, it } from 'vitest';
import {
  COMPOSE_SUBMIT_FLOW_IDLE,
  composeSubmitFlowBlocksSessionPersist,
  composeSubmitFlowIsSubmitting,
  composeSubmitFlowResult,
  type ComposeSubmitFlowStatus,
} from './composeSubmitFlowStatus';

const result = { id: 'a1' };

describe('composeSubmitFlowStatus', () => {
  it('idle has no in-flight submit or result', () => {
    expect(composeSubmitFlowIsSubmitting(COMPOSE_SUBMIT_FLOW_IDLE)).toBe(false);
    expect(composeSubmitFlowResult(COMPOSE_SUBMIT_FLOW_IDLE)).toBeNull();
    expect(composeSubmitFlowBlocksSessionPersist(COMPOSE_SUBMIT_FLOW_IDLE)).toBe(false);
  });

  it('submitting and submitted are mutually exclusive', () => {
    const submitting: ComposeSubmitFlowStatus<typeof result> = { kind: 'submitting' };
    const submitted: ComposeSubmitFlowStatus<typeof result> = { kind: 'submitted', result };

    expect(composeSubmitFlowIsSubmitting(submitting)).toBe(true);
    expect(composeSubmitFlowResult(submitting)).toBeNull();

    expect(composeSubmitFlowIsSubmitting(submitted)).toBe(false);
    expect(composeSubmitFlowResult(submitted)).toEqual(result);
    expect(composeSubmitFlowBlocksSessionPersist(submitted)).toBe(true);
  });
});