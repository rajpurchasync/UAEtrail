import { describe, expect, it } from 'vitest';
import { buildHeroSlides, MARKETING_HERO_CAROUSEL_SLIDES } from './buildHeroSlides';

describe('buildHeroSlides', () => {
  it('returns curated static marketing slides only', () => {
    const slides = buildHeroSlides();
    expect(slides).toEqual([...MARKETING_HERO_CAROUSEL_SLIDES]);
    expect(slides).toHaveLength(5);
    for (const slide of slides) {
      expect(slide.imageUrl).toBeTruthy();
      expect(slide.alt).toBeTruthy();
      expect(slide).not.toHaveProperty('href');
    }
    const layoutSlides = slides.filter((slide) => slide.layoutSources);
    expect(layoutSlides).toHaveLength(4);
    for (const slide of layoutSlides) {
      const { mobile, desktop } = slide.layoutSources!;
      expect(mobile.jpeg).toContain('-mobile.jpg');
      expect(desktop.jpeg).toContain('-desktop.jpg');
      expect(slide.layoutSources!.layoutMinWidthPx).toBe(768);
    }
  });
});
