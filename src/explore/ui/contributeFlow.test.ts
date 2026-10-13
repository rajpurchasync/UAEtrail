import { describe, expect, it } from 'vitest';
import { getContributeFlowSteps } from './contributeFlow';

describe('contributeFlow steps', () => {
  it('add trail matches hiking place wizard', () => {
    expect(getContributeFlowSteps('hiking')).toEqual([
      'title',
      'curatedArea',
      'image',
      'location',
      'trail_stats',
      'difficulty',
      'about',
      'transport',
      'review',
    ]);
  });

  it('add camp matches camping place wizard', () => {
    expect(getContributeFlowSteps('camping')).toEqual([
      'title',
      'curatedArea',
      'image',
      'location',
      'surface',
      'about',
      'transport',
      'review',
    ]);
  });

  it('add shop matches shop wizard', () => {
    expect(getContributeFlowSteps('shop')).toEqual([
      'title',
      'curatedArea',
      'location',
      'about',
      'shop_products',
      'shop_keywords',
      'image',
      'shop_delivery',
      'shop_phone',
      'shop_email',
      'review',
    ]);
  });

  it('add spot (others) matches event venue kind', () => {
    expect(getContributeFlowSteps('event')).toEqual([
      'title',
      'curatedArea',
      'location',
      'image',
      'description',
      'parking',
      'review',
    ]);
  });
});
