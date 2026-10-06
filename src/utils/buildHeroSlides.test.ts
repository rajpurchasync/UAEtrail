import { describe, expect, it } from 'vitest';
import { buildHeroSlides } from './buildHeroSlides';
import { HOME_LANDING_FALLBACK_ACTIVITIES } from '../content/homeLanding';

describe('buildHeroSlides', () => {
  it('returns curated fallbacks when no activities', () => {
    const slides = buildHeroSlides([]);
    expect(slides.length).toBeGreaterThanOrEqual(2);
    expect(slides[0].title).toBe(HOME_LANDING_FALLBACK_ACTIVITIES[0].title);
  });

  it('caps live activities at five slides', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      ...HOME_LANDING_FALLBACK_ACTIVITIES[0],
      id: `act-${i}`,
      title: `Activity ${i}`
    }));
    expect(buildHeroSlides(many)).toHaveLength(5);
  });
});
