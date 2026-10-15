import { describe, expect, it } from 'vitest';
import { shouldShowConsumerDetailLeadVenue } from './activityConsumerDetailLeadVenue';

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
