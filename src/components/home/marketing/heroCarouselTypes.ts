export type HeroCarouselSlideLayoutSources = {
  mobile: { jpeg: string; webp?: string };
  desktop: { jpeg: string; webp?: string };
  /** `min-width` for desktop art — default guest hero `md` (768px). */
  layoutMinWidthPx?: number;
};

export type HeroCarouselSlide = {
  id: string;
  imageUrl: string;
  imageSrcSet?: string;
  /** Tiny blur preview (`public/landing/hero/*-lqip.webp`) — shown until full-res loads. */
  placeholderUrl?: string;
  /** When set, hero uses `<picture>` so mobile/desktop crops follow layout breakpoint. */
  layoutSources?: HeroCarouselSlideLayoutSources;
  alt: string;
};

export const HERO_CAROUSEL_AUTOPLAY_MS = 5500;
