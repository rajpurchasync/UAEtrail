/** Guest `/` hero carousel — stable paths under `public/landing/hero/`. */

import type {
  HeroCarouselSlide,
  HeroCarouselSlideLayoutSources
} from '../components/home/v2/heroCarouselTypes';

/** Matches Tailwind `md` and guest hero overlay (`home-tokens.css` --bp-md). */
export const MARKETING_HERO_LAYOUT_MIN_WIDTH_PX = 768;

const heroBase = (key: string) => `/landing/hero/hero-${key}`;

export const marketingHeroLqipUrl = (key: string) => `${heroBase(key)}-lqip.webp`;

export const marketingHeroLayoutSources = (key: string): HeroCarouselSlideLayoutSources => {
  const base = heroBase(key);
  return {
    layoutMinWidthPx: MARKETING_HERO_LAYOUT_MIN_WIDTH_PX,
    mobile: { jpeg: `${base}-mobile.jpg`, webp: `${base}-mobile.webp` },
    desktop: { jpeg: `${base}-desktop.jpg`, webp: `${base}-desktop.webp` }
  };
};

/** Art-directed mobile vs desktop crops (not width-only `srcSet`). */
export const marketingHeroLayoutSlide = (
  key: string,
  alt: string
): Pick<HeroCarouselSlide, 'imageUrl' | 'placeholderUrl' | 'layoutSources' | 'alt'> => {
  const layoutSources = marketingHeroLayoutSources(key);
  return {
    imageUrl: layoutSources.mobile.jpeg,
    placeholderUrl: marketingHeroLqipUrl(key),
    layoutSources,
    alt
  };
};
