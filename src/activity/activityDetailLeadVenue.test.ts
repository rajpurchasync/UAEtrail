import { describe, expect, it } from 'vitest';
import { shouldShowActivityDetailLeadVenue } from './activityDetailLeadVenue';

describe('shouldShowActivityDetailLeadVenue', () => {
  it('hides venue when it matches or overlaps the title', () => {
    expect(
      shouldShowActivityDetailLeadVenue('Wadi Shawka Community Hike', 'Wadi Shawka Community Hike', false)
    ).toBe(false);
    expect(
      shouldShowActivityDetailLeadVenue('Wadi Shawka Community Hike', 'Wadi Shawka', false)
    ).toBe(false);
  });

  it('hides venue when the Where place card is shown', () => {
    expect(shouldShowActivityDetailLeadVenue('Sunrise jog', 'Kite Beach', true)).toBe(false);
  });

  it('shows distinct venue labels without a place card', () => {
    expect(shouldShowActivityDetailLeadVenue('Sunrise jog', 'Kite Beach', false)).toBe(true);
  });
});
