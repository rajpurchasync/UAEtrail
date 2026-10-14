import { describe, expect, it } from 'vitest';
import { marketingHeroLayoutSources, MARKETING_HERO_LAYOUT_MIN_WIDTH_PX } from './marketingHeroImages';

describe('marketingHeroLayoutSources', () => {
  it('maps separate mobile and desktop art at the guest hero md breakpoint', () => {
    const sources = marketingHeroLayoutSources('al-rabi');
    expect(sources.layoutMinWidthPx).toBe(MARKETING_HERO_LAYOUT_MIN_WIDTH_PX);
    expect(sources.mobile.jpeg).toMatch(/-mobile\.jpg$/);
    expect(sources.desktop.jpeg).toMatch(/-desktop\.jpg$/);
    expect(sources.mobile.webp).toMatch(/-mobile\.webp$/);
    expect(sources.desktop.webp).toMatch(/-desktop\.webp$/);
  });
});
