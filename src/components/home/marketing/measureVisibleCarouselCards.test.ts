import { describe, expect, it } from 'vitest';
import {
  carouselPageCount,
  carouselPageFromCardIndex,
  carouselPageFromScrollPosition,
  carouselStartCardIndex,
  trackHasHorizontalScroll
} from './measureVisibleCarouselCards';

describe('carousel page math', () => {
  it('computes page count from visible cards', () => {
    expect(carouselPageCount(15, 3)).toBe(5);
    expect(carouselPageCount(15, 4)).toBe(4);
    expect(carouselPageCount(2, 3)).toBe(1);
  });

  it('maps card index to page', () => {
    expect(carouselPageFromCardIndex(0, 3, 5)).toBe(0);
    expect(carouselPageFromCardIndex(3, 3, 5)).toBe(1);
    expect(carouselPageFromCardIndex(14, 3, 5)).toBe(4);
  });

  it('maps page to start card', () => {
    expect(carouselStartCardIndex(0, 3, 15)).toBe(0);
    expect(carouselStartCardIndex(1, 3, 15)).toBe(3);
    expect(carouselStartCardIndex(4, 3, 15)).toBe(12);
  });

  it('snaps scroll edges to first and last page', () => {
    expect(carouselPageFromScrollPosition(0, 900, 4, 2)).toBe(0);
    expect(carouselPageFromScrollPosition(898, 900, 4, 2)).toBe(3);
    expect(carouselPageFromScrollPosition(450, 900, 4, 1)).toBe(1);
  });

  it('detects when a track cannot scroll horizontally', () => {
    const track = { scrollWidth: 400, clientWidth: 400 } as HTMLElement;
    expect(trackHasHorizontalScroll(track)).toBe(false);
    const scrollable = { scrollWidth: 900, clientWidth: 400 } as HTMLElement;
    expect(trackHasHorizontalScroll(scrollable)).toBe(true);
  });
});
