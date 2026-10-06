import { HOME_HERO_IMAGE_JPEG } from '../config/seo';
import { resolveActivityTypeCoverImage } from '../config/activityCoverImages';
import type { HeroCarouselSlide } from '../components/home/v2/heroCarouselTypes';
import type { HomeLandingActivity } from '../content/homeLanding';
import { HOME_LANDING_FALLBACK_ACTIVITIES } from '../content/homeLanding';
import { mapHomeLandingActivityToCard } from './mapHomeLandingActivity';

const toSlide = (activity: HomeLandingActivity, imageUrl: string, alt: string): HeroCarouselSlide => {
  const card = mapHomeLandingActivityToCard(activity);
  return {
    id: activity.id,
    imageUrl,
    alt,
    title: card.title,
    emirate: card.emirate,
    startsAt: card.startsAt,
    priceLabel: card.priceLabel,
    href: card.href
  };
};

const curatedFallbackSlides = (): HeroCarouselSlide[] =>
  HOME_LANDING_FALLBACK_ACTIVITIES.slice(0, 3).map((activity, index) => {
    const imageUrl =
      index === 0
        ? HOME_HERO_IMAGE_JPEG
        : resolveActivityTypeCoverImage(activity.activityType, null, {
            activityId: activity.id,
            variantIndex: index
          });
    return toSlide(activity, imageUrl, `${activity.title} in ${activity.region}`);
  });

/** Up to 5 slides from live/cached activities; 2–3 curated slides when empty. */
export const buildHeroSlides = (activities: HomeLandingActivity[]): HeroCarouselSlide[] => {
  if (activities.length === 0) {
    return curatedFallbackSlides();
  }

  return activities.slice(0, 5).map((activity) => {
    const card = mapHomeLandingActivityToCard(activity);
    return {
      id: activity.id,
      imageUrl: card.imageUrl,
      alt: card.imageAlt,
      title: card.title,
      emirate: card.emirate,
      startsAt: card.startsAt,
      priceLabel: card.priceLabel,
      href: card.href
    };
  });
};
