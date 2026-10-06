export type HeroCarouselSlide = {
  id: string;
  imageUrl: string;
  imageSrcSet?: string;
  alt: string;
  title: string;
  emirate: string;
  startsAt: string | Date;
  priceLabel: string;
  href: string;
};

export const HERO_CAROUSEL_AUTOPLAY_MS = 5500;
