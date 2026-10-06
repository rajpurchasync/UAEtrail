import { ACTIVITY_TYPE_COVER_IMAGE_POOLS } from '../config/activityCoverImages';
import { HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../config/seo';
import type { HeroCarouselSlide } from '../components/home/v2/heroCarouselTypes';

/** Curated marketing backgrounds only — live outings appear in `HomeActivitiesSection`. */
export const MARKETING_HERO_CAROUSEL_SLIDES: readonly HeroCarouselSlide[] = [
  {
    id: 'hero-bundled',
    imageUrl: HOME_HERO_IMAGE_JPEG,
    imageSrcSet: `${HOME_HERO_IMAGE_WEBP} 1200w, ${HOME_HERO_IMAGE_JPEG} 1600w`,
    alt: 'Group getting outdoors in the UAE'
  },
  {
    id: 'hero-hike-hatta',
    imageUrl: ACTIVITY_TYPE_COVER_IMAGE_POOLS.hiking[1],
    alt: 'Hatta dam and Hajar mountain trails'
  },
  {
    id: 'hero-camp-desert',
    imageUrl: ACTIVITY_TYPE_COVER_IMAGE_POOLS.camping[0],
    alt: 'Desert camping under UAE rock formations'
  },
  {
    id: 'hero-hike-fujairah',
    imageUrl: ACTIVITY_TYPE_COVER_IMAGE_POOLS.hiking[2],
    alt: 'Hajar mountains along the Gulf of Oman'
  }
];

export const buildHeroSlides = (): HeroCarouselSlide[] => [...MARKETING_HERO_CAROUSEL_SLIDES];
