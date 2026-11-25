import { describe, expect, it } from 'vitest';
import { getAvailabilityFixedFlowSteps } from './intentFixedFlowEngine';

describe('intentFixedFlowEngine steps', () => {
  it('find hiking is area then going from (no destination pin)', () => {
    expect(getAvailabilityFixedFlowSteps('hiking')).toEqual([
      'title',
      'when',
      'curatedDestination',
      'persons',
      'audience',
      'from',
      'info',
      'transport',
      'review',
    ]);
  });

  it('find camping is area then going from (no destination pin)', () => {
    expect(getAvailabilityFixedFlowSteps('camping')).toEqual([
      'title',
      'when',
      'curatedDestination',
      'persons',
      'audience',
      'from',
      'info',
      'transport',
      'review',
    ]);
  });

  it('find rideshare keeps from and to after area', () => {
    expect(getAvailabilityFixedFlowSteps('rideshare')).toEqual([
      'title',
      'when',
      'curatedDestination',
      'from',
      'to',
      'persons',
      'audience',
      'info',
      'review',
    ]);
  });

  it('find activity is area then going from', () => {
    expect(getAvailabilityFixedFlowSteps('event')).toEqual([
      'title',
      'when',
      'curatedDestination',
      'persons',
      'audience',
      'from',
      'info',
      'review',
    ]);
  });
});
