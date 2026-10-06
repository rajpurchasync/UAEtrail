import { describe, expect, it } from 'vitest';
import { buildHeroSlides, MARKETING_HERO_CAROUSEL_SLIDES } from './buildHeroSlides';

describe('buildHeroSlides', () => {
  it('returns curated static marketing slides only', () => {
    const slides = buildHeroSlides();
    expect(slides).toEqual([...MARKETING_HERO_CAROUSEL_SLIDES]);
    expect(slides.length).toBeGreaterThanOrEqual(3);
    for (const slide of slides) {
      expect(slide.imageUrl).toBeTruthy();
      expect(slide.alt).toBeTruthy();
      expect(slide).not.toHaveProperty('href');
    }
  });
});
