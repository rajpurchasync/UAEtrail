import { describe, expect, it } from 'vitest';
import { getDemandFlowSteps } from './seekingFlowEngine';

describe('demandFlow steps', () => {
  it('find hiking matches FLOW-06', () => {
    expect(getDemandFlowSteps('hiking')).toEqual([
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
    expect(getDemandFlowSteps('camping')).toEqual([
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
    expect(getDemandFlowSteps('rideshare')).toEqual([
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
    expect(getDemandFlowSteps('event')).toEqual([
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
