import { describe, expect, it } from 'vitest';
import { getAddFlowSteps } from './addFlow';

describe('addFlow steps', () => {
  it('add trail matches hiking place wizard', () => {
    expect(getAddFlowSteps('hiking')).toEqual([
      'title',
      'curatedDestination',
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
    expect(getAddFlowSteps('camping')).toEqual([
      'title',
      'curatedDestination',
      'image',
      'location',
      'surface',
      'about',
      'transport',
      'review',
    ]);
  });

  it('add shop matches shop wizard', () => {
    expect(getAddFlowSteps('shop')).toEqual([
      'title',
      'curatedDestination',
      'location',
      'about',
      'shop_keywords',
      'image',
      'shop_delivery',
      'shop_phone',
      'shop_email',
      'review',
    ]);
  });

  it('add facility matches facility wizard', () => {
    expect(getAddFlowSteps('facility')).toEqual([
      'title',
      'facilityType',
      'curatedDestination',
      'parentPlace',
      'location',
      'image',
      'description',
      'review',
    ]);
  });

  it('add spot (others) matches event venue kind', () => {
    expect(getAddFlowSteps('event')).toEqual([
      'title',
      'curatedDestination',
      'location',
      'image',
      'description',
      'parking',
      'review',
    ]);
  });
});
