import { describe, expect, it } from 'vitest';
import { getContributeFlowSteps } from './contributeFlow';

describe('contributeFlow steps', () => {
  it('add trail matches hiking place wizard', () => {
    expect(getContributeFlowSteps('hiking')).toEqual([
      'title',
      'location',
      'image',
      'description',
      'difficulty',
      'parking',
      'review',
    ]);
  });

  it('add camp matches camping place wizard', () => {
    expect(getContributeFlowSteps('camping')).toEqual([
      'title',
      'location',
      'image',
      'description',
      'parking',
      'review',
    ]);
  });

  it('add shop includes contact step', () => {
    expect(getContributeFlowSteps('shop')).toEqual([
      'title',
      'location',
      'image',
      'description',
      'contact',
      'review',
    ]);
  });

  it('add spot (others) matches event venue kind', () => {
    expect(getContributeFlowSteps('event')).toEqual([
      'title',
      'location',
      'image',
      'description',
      'parking',
      'review',
    ]);
  });
});
