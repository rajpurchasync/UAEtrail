import { describe, expect, it } from 'vitest';
import { shouldCarouselAutoplay, stepCarouselIndex } from './heroCarouselState';

describe('stepCarouselIndex', () => {
  it('steps forward and wraps', () => {
    expect(stepCarouselIndex(0, 3, 1)).toBe(1);
    expect(stepCarouselIndex(2, 3, 1)).toBe(0);
  });

  it('steps backward and wraps', () => {
    expect(stepCarouselIndex(0, 3, -1)).toBe(2);
  });
});

describe('shouldCarouselAutoplay', () => {
  const open = {
    reducedMotion: false,
    userPaused: false,
    hovered: false,
    focused: false,
    touching: false
  };

  it('runs when all gates are open', () => {
    expect(shouldCarouselAutoplay(open)).toBe(true);
  });

  it('pauses when user paused', () => {
    expect(shouldCarouselAutoplay({ ...open, userPaused: true })).toBe(false);
  });

  it('pauses under reduced motion', () => {
    expect(shouldCarouselAutoplay({ ...open, reducedMotion: true })).toBe(false);
  });

  it('pauses on hover or focus or touch', () => {
    expect(shouldCarouselAutoplay({ ...open, hovered: true })).toBe(false);
    expect(shouldCarouselAutoplay({ ...open, focused: true })).toBe(false);
    expect(shouldCarouselAutoplay({ ...open, touching: true })).toBe(false);
  });
});
