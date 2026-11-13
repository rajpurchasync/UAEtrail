import { describe, expect, it } from 'vitest';
import {
  shouldShowConsumerDetailHeroVenue,
  shouldShowConsumerDetailLeadVenue,
} from './activityConsumerDetailLeadVenue';

describe('shouldShowConsumerDetailLeadVenue', () => {
  it('hides venue when it matches or overlaps the title', () => {
    expect(
      shouldShowConsumerDetailLeadVenue('Wadi Shawka Community Hike', 'Wadi Shawka Community Hike', false)
    ).toBe(false);
    expect(
      shouldShowConsumerDetailLeadVenue('Wadi Shawka Community Hike', 'Wadi Shawka', false)
    ).toBe(false);
  });

  it('hides venue when the Where place card is shown', () => {
    expect(shouldShowConsumerDetailLeadVenue('Sunrise jog', 'Kite Beach', true)).toBe(false);
  });

  it('shows distinct venue labels without a place card', () => {
    expect(shouldShowConsumerDetailLeadVenue('Sunrise jog', 'Kite Beach', false)).toBe(true);
  });
});

describe('shouldShowConsumerDetailHeroVenue', () => {
  it('shows hero venue when place path exists even if title matches', () => {
    expect(
      shouldShowConsumerDetailHeroVenue('Baqal Caves', '/place/baqal-caves', false)
    ).toBe(true);
  });

  it('hides when there is no place path or on rideshare', () => {
    expect(shouldShowConsumerDetailHeroVenue('Kite Beach', null, false)).toBe(false);
    expect(shouldShowConsumerDetailHeroVenue('Ride', '/place/x', true)).toBe(false);
  });
});
