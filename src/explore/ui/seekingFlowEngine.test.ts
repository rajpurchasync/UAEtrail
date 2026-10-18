import { describe, expect, it } from 'vitest';
import { getSeekingFlowSteps } from './seekingFlowEngine';

describe('seekingFlowEngine steps', () => {
  it('find hiking matches FLOW-06', () => {
    expect(getSeekingFlowSteps('hiking')).toEqual([
      'title',
      'when',
      'curatedArea',
      'destination',
      'persons',
      'audience',
      'from',
      'info',
      'transport',
      'review',
    ]);
  });

  it('find camping matches FLOW-07', () => {
    expect(getSeekingFlowSteps('camping')).toEqual([
      'title',
      'when',
      'curatedArea',
      'destination',
      'persons',
      'audience',
      'from',
      'info',
      'transport',
      'review',
    ]);
  });

  it('find rideshare matches FLOW-08', () => {
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

  it('find activity matches FLOW-09', () => {
    expect(getSeekingFlowSteps('event')).toEqual([
      'title',
      'when',
      'curatedArea',
      'persons',
      'audience',
      'info',
      'review',
    ]);
  });
});
