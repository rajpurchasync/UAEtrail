import { describe, expect, it } from 'vitest';
import { allowedActivityPricingModes } from './activity-pricing.js';

const businessTiers = { community: true, professional: false, business: true };

describe('activity-pricing tiers', () => {
  it('allowedActivityPricingModes matches product ladder', () => {
    expect(allowedActivityPricingModes({ community: true, professional: false, business: false })).toEqual([
      'free',
      'shared',
    ]);
    expect(
      allowedActivityPricingModes({ community: true, professional: true, business: false }, {
        publishingProfileKind: 'pro_guide',
      })
    ).toEqual(['free', 'shared']);
    expect(
      allowedActivityPricingModes(businessTiers, { publishingProfileKind: 'agency' })
    ).toEqual(['free', 'shared', 'paid']);
    expect(
      allowedActivityPricingModes(businessTiers, { publishingProfileKind: 'shop' })
    ).toEqual(['free', 'shared', 'paid']);
    expect(
      allowedActivityPricingModes(businessTiers, { publishingProfileKind: 'partner' })
    ).toEqual(['free', 'shared', 'paid']);
    expect(
      allowedActivityPricingModes({ community: true, professional: false, business: false }, {
        publishingProfileKind: 'agency',
      })
    ).toEqual(['free', 'shared']);
    expect(
      allowedActivityPricingModes(businessTiers, { publishingProfileKind: 'pro_guide' })
    ).toEqual(['free', 'shared']);
  });
});
