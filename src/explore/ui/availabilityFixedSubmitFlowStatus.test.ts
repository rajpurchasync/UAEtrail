import { describe, expect, it } from 'vitest';
import {
  AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE,
  availabilityFixedSubmitFlowBlocksSessionPersist,
  availabilityFixedSubmitFlowIsSubmitting,
  availabilityFixedSubmitFlowResult,
  type AvailabilityFixedSubmitFlowStatus,
} from './availabilityFixedSubmitFlowStatus';

const result = { visibleOnMap: true, mapItemId: 'm1' };

describe('availabilityFixedSubmitFlowStatus', () => {
  it('idle has no in-flight submit or result', () => {
    expect(availabilityFixedSubmitFlowIsSubmitting(AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE)).toBe(false);
    expect(availabilityFixedSubmitFlowResult(AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE)).toBeNull();
    expect(availabilityFixedSubmitFlowBlocksSessionPersist(AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE)).toBe(false);
  });

  it('submitting and submitted are mutually exclusive', () => {
    const submitting: AvailabilityFixedSubmitFlowStatus = { kind: 'submitting' };
    const submitted: AvailabilityFixedSubmitFlowStatus = { kind: 'submitted', result };

    expect(availabilityFixedSubmitFlowIsSubmitting(submitting)).toBe(true);
    expect(availabilityFixedSubmitFlowResult(submitting)).toBeNull();

    expect(availabilityFixedSubmitFlowIsSubmitting(submitted)).toBe(false);
    expect(availabilityFixedSubmitFlowResult(submitted)).toEqual(result);
    expect(availabilityFixedSubmitFlowBlocksSessionPersist(submitted)).toBe(true);
  });
});