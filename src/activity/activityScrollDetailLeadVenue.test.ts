import { describe, expect, it } from 'vitest';
import { shouldShowActivityScrollLeadVenue } from './activityScrollDetailLeadVenue';

describe('shouldShowActivityScrollLeadVenue', () => {
  it('hides venue when it matches or overlaps the title', () => {
    expect(
      shouldShowActivityScrollLeadVenue('Wadi Shawka Community Hike', 'Wadi Shawka Community Hike', false)
    ).toBe(false);
    expect(
      shouldShowActivityScrollLeadVenue('Wadi Shawka Community Hike', 'Wadi Shawka', false)
    ).toBe(false);
  });

  it('hides venue when the Where place card is shown', () => {
    expect(shouldShowActivityScrollLeadVenue('Sunrise jog', 'Kite Beach', true)).toBe(false);
  });

  it('shows distinct venue labels without a place card', () => {
    expect(shouldShowActivityScrollLeadVenue('Sunrise jog', 'Kite Beach', false)).toBe(true);
  });
});
