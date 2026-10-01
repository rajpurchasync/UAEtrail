import { describe, expect, it } from 'vitest';
import {
  demandFallbackTitle,
  isGenericDemandPlanTitle,
  isLegacyEmbeddedDemandTitle,
  normalizeLegacyDemandTitle,
} from '@uaetrail/shared-types';

describe('demand titles', () => {
  it('detects legacy embedded requester titles', () => {
    expect(isLegacyEmbeddedDemandTitle('Sarah wants to go hiking')).toBe(true);
    expect(isLegacyEmbeddedDemandTitle('Alex needs a carpool')).toBe(true);
    expect(isLegacyEmbeddedDemandTitle('Morning hike at Hatta')).toBe(false);
  });

  it('normalizes legacy titles to canonical fallbacks', () => {
    expect(normalizeLegacyDemandTitle('Sarah wants to go hiking', 'hiking')).toBe(
      demandFallbackTitle('hiking')
    );
    expect(normalizeLegacyDemandTitle('Sunrise yoga', 'event')).toBe('Sunrise yoga');
  });

  it('treats fallback and legacy titles as generic plan titles', () => {
    expect(isGenericDemandPlanTitle('Rideshare request', 'rideshare')).toBe(true);
    expect(isGenericDemandPlanTitle('Sarah wants to go hiking', 'hiking')).toBe(true);
    expect(isGenericDemandPlanTitle('Sunrise yoga at Kite Beach', 'event')).toBe(false);
  });
});
