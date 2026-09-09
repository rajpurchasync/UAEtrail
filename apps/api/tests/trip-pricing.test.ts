import { describe, expect, it } from 'vitest';
import {
  derivePriceAed,
  inferTripPricingMode,
  normalizeActivityPricing,
  parseStoredPricePackages,
  tripHasPaidPricing,
  tripPriceLabel,
} from '@uaetrail/shared-types';

describe('trip pricing', () => {
  it('normalizes free pricing', () => {
    expect(normalizeActivityPricing({ price: 0, pricePackages: [] })).toEqual({
      priceAed: 0,
      pricePackages: [],
      pricingMode: 'free',
    });
  });

  it('normalizes paid packages and derives minimum AED price', () => {
    const pricing = normalizeActivityPricing({
      pricingMode: 'paid',
      pricePackages: [
        { label: 'Standard', amount: 120, currency: 'AED' },
        { label: 'VIP', amount: 200, currency: 'AED' },
      ],
    });
    expect(pricing.pricingMode).toBe('paid');
    expect(pricing.priceAed).toBe(120);
    expect(derivePriceAed(pricing.pricePackages)).toBe(120);
  });

  it('parses stored packages leniently', () => {
    expect(parseStoredPricePackages([{ label: 'Adult', amount: 50, currency: 'AED' }])).toHaveLength(1);
    expect(parseStoredPricePackages([{ label: '', amount: 50, currency: 'AED' }])).toHaveLength(0);
  });

  it('infers pricing mode and labels', () => {
    expect(
      inferTripPricingMode({
        price: 0,
        pricePackages: [],
        paymentTerms: null,
        pricingMode: 'free',
      })
    ).toBe('free');

    expect(
      tripPriceLabel({
        price: 0,
        pricePackages: [
          { label: 'Adult', amount: 80, currency: 'AED' },
          { label: 'Child', amount: 40, currency: 'AED' },
        ],
      })
    ).toBe('From AED 40');

    expect(tripHasPaidPricing({ price: 0, pricePackages: [{ label: 'Adult', amount: 80, currency: 'AED' }] })).toBe(
      true
    );
  });
});
