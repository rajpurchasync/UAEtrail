import { describe, expect, it } from 'vitest';
import { getSeekingFlowSteps } from './availabilityFlowEngine';

describe('availabilityFlowEngine steps', () => {
  it('find hiking is area then going from (no destination pin)', () => {
    expect(getSeekingFlowSteps('hiking')).toEqual([
      'title',
      'when',
      'curatedArea',
      'persons',
      'audience',
      'from',
      'info',
      'transport',
      'review',
    ]);
  });

  it('find camping is area then going from (no destination pin)', () => {
    expect(getSeekingFlowSteps('camping')).toEqual([
      'title',
      'when',
      'curatedArea',
      'persons',
      'audience',
      'from',
      'info',
      'transport',
      'review',
    ]);
  });

  it('find rideshare keeps from and to after area', () => {
    expect(getSeekingFlowSteps('rideshare')).toEqual([
      'title',
      'when',
      'curatedArea',
      'from',
      'to',
      'persons',
      'audience',
      'info',
      'review',
    ]);
  });

  it('find activity is area then going from', () => {
    expect(getSeekingFlowSteps('event')).toEqual([
      'title',
      'when',
      'curatedArea',
      'persons',
      'audience',
      'from',
      'info',
      'review',
    ]);
  });
});
