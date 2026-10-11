import { describe, expect, it } from 'vitest';
import {
  activityHasPaidPricing,
  activityPriceLabel,
  allowedActivityPricingModes,
  normalizeActivityPricing,
} from '@uaetrail/shared-types';
import { assertActivityPricingAllowed } from '../src/domain/activity-pricing.js';

describe('activity pricing', () => {
  it('normalizes free / shared / paid from pricingMode + price', () => {
    expect(normalizeActivityPricing({ price: 0, pricingMode: 'free' })).toEqual({
      priceAed: 0,
      pricingMode: 'free',
    });
    expect(normalizeActivityPricing({ price: 40, pricingMode: 'shared' })).toEqual({
      priceAed: 40,
      pricingMode: 'shared',
    });
    expect(normalizeActivityPricing({ price: 120, pricingMode: 'paid' })).toEqual({
      priceAed: 120,
      pricingMode: 'paid',
    });
  });

  it('allowed modes follow host tier ladder', () => {
    expect(allowedActivityPricingModes({ community: true, professional: false, business: false })).toEqual([
      'free',
    ]);
    expect(
      allowedActivityPricingModes({ community: true, professional: true, business: false })
    ).toEqual(['free', 'shared']);
    expect(
      allowedActivityPricingModes({ community: false, professional: false, business: true })
    ).toEqual(['free', 'shared', 'paid']);
  });

  it('activityPriceLabel uses single indicative amount', () => {
    expect(activityPriceLabel({ price: 0, pricingMode: 'free' })).toBe('Free');
    expect(activityPriceLabel({ price: 50, pricingMode: 'shared' })).toBe('AED 50');
  });

  it('activityHasPaidPricing respects pricingMode', () => {
    expect(activityHasPaidPricing({ price: 0, pricingMode: 'free' })).toBe(false);
    expect(activityHasPaidPricing({ price: 10, pricingMode: 'shared' })).toBe(true);
    expect(activityHasPaidPricing({ price: 0, pricingMode: 'paid' })).toBe(true);
  });

  it('assertActivityPricingAllowed enforces tier gates', () => {
    expect(() =>
      assertActivityPricingAllowed({
        hostTiers: { community: true, professional: false, business: false },
        pricingMode: 'shared',
        priceAed: 25,
        sharedAmountAed: 25,
      })
    ).toThrow(/Shared-cost activities require/);

    expect(() =>
      assertActivityPricingAllowed({
        hostTiers: { community: true, professional: true, business: false },
        pricingMode: 'paid',
        priceAed: 100,
      })
    ).toThrow(/Paid activities require a business host account/);
  });
});
