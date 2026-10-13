import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../config/seo';
import { marketingHeroResponsiveSlide } from '../config/marketingHeroImages';
import type { HeroCarouselSlide } from '../components/home/v2/heroCarouselTypes';

/** Curated marketing backgrounds only — live outings appear in `HomeActivitiesSection`. */
export const MARKETING_HERO_CAROUSEL_SLIDES: readonly HeroCarouselSlide[] = [
  {
    id: 'hero-summit-hiker',
    imageUrl: HOME_HERO_IMAGE_JPEG,
    imageSrcSet: `${HOME_HERO_IMAGE_WEBP} 1200w, ${HOME_HERO_IMAGE_JPEG} 1600w`,
    alt: 'Hiker at a mountain summit in the UAE'
  },
  {
    id: 'hero-al-rabi',
    ...marketingHeroResponsiveSlide('al-rabi', 'Al Rabi mountain trail, Khorfakkan')
  },
  {
    id: 'hero-arar',
    ...marketingHeroResponsiveSlide('arar', 'Arar outdoor landscape in the UAE')
  },
  {
    id: 'hero-fossil-rock',
    ...marketingHeroResponsiveSlide('fossil-rock', 'Fossil Rock, Sharjah desert')
  },
  {
    id: 'hero-saliyat-al-baqal',
    ...marketingHeroResponsiveSlide('saliyat-al-baqal', 'Saliyat al Baqal, UAE outdoors')
  }
];

export const buildHeroSlides = (): HeroCarouselSlide[] => [...MARKETING_HERO_CAROUSEL_SLIDES];
