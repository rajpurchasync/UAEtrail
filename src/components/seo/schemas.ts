import {
  ActivityDetailDTO,
  ReviewDTO,
  resolveActivityPublisherProfilePath,
} from '@uaetrail/shared-types';
import { SITE_ORIGIN, toAbsoluteUrl } from '../../config/seo';
import type { Place } from '../../types/place';
import { placeDetailPath } from '../../utils/placePaths';
import type { TenantPublicDTO } from '@uaetrail/shared-types';
import { activityHostName } from '../../utils/hostLabels';
import { buildActivityEventJsonLd } from '@uaetrail/shared-types';

export { websiteSchema } from './websiteSchema';

const absImage = (url?: string | null) => toAbsoluteUrl(url) ?? undefined;

const locationAddress = (region?: string) => ({
  '@type': 'PostalAddress' as const,
  addressCountry: 'AE',
  addressRegion: region ?? 'UAE'
});

const placeGeo = (place: Pick<Place, 'latitude' | 'longitude'>) =>
  place.latitude != null && place.longitude != null
    ? { '@type': 'GeoCoordinates' as const, latitude: place.latitude, longitude: place.longitude }
    : undefined;

/** JSON-LD for a unified place (trail, camp, or event venue). */
export const placeSchema = (place: Place) => {
  const url = `${SITE_ORIGIN}${placeDetailPath(place.activityType, place.id)}`;

  if (place.activityType === 'camping') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Campground',
      name: place.name,
      description: place.description,
      url,
      image: absImage(place.images?.[0]),
      address: locationAddress(place.region),
      geo: placeGeo(place),
      additionalProperty: [
        place.campingType
          ? { '@type': 'PropertyValue', name: 'campingType', value: place.campingType }
          : null,
        { '@type': 'PropertyValue', name: 'region', value: place.region },
      ].filter(Boolean),
    };
  }

  if (place.activityType === 'event') {
    return {
      '@context': 'https://schema.org',
      '@type': 'TouristAttraction',
      name: place.name,
      description: place.description,
      url,
      image: absImage(place.images?.[0]),
      address: locationAddress(place.region),
      geo: placeGeo(place),
      touristType: 'Outdoor event venue',
      additionalProperty: [{ '@type': 'PropertyValue', name: 'region', value: place.region }],
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.name,
    description: place.description,
    url,
    image: absImage(place.images?.[0]),
    address: locationAddress(place.region),
    geo: placeGeo(place),
    touristType: 'Hiker',
    additionalProperty: [
      place.difficulty
        ? { '@type': 'PropertyValue', name: 'difficulty', value: place.difficulty }
        : null,
      place.distance != null && place.distance > 0
        ? { '@type': 'PropertyValue', name: 'distanceKm', value: place.distance }
        : null,
      { '@type': 'PropertyValue', name: 'region', value: place.region },
    ].filter(Boolean),
  };
};

export const activityEventSchema = (activity: ActivityDetailDTO) => {
  const schema = buildActivityEventJsonLd(activity, SITE_ORIGIN) as Record<string, unknown>;
  const organizer = schema.organizer as Record<string, unknown> | undefined;
  if (organizer) {
    organizer.name = activityHostName(activity);
    const path = resolveActivityPublisherProfilePath({
      publishingProfileKind: activity.publishingProfileKind ?? 'pro_guide',
      tenantSlug: activity.tenantSlug,
      hostUserId: activity.hostUserId,
    });
    if (path) organizer.url = `${SITE_ORIGIN}${path}`;
  }
  const image = absImage(activity.images?.[0] ?? activity.location?.images?.[0] ?? activity.bannerUrl);
  if (image) schema.image = image;
  return schema;
};

const averageRating = (reviews: ReviewDTO[]) => {
  if (reviews.length === 0) return undefined;
  const value = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { value: Math.round(value * 10) / 10, count: reviews.length };
};

export const organizationSchema = (
  tenant: TenantPublicDTO,
  _slug: string,
  reviews: ReviewDTO[] = [],
  publicProfilePath: string
) => {
  const rating = averageRating(reviews);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenant.name,
    url: `${SITE_ORIGIN}${publicProfilePath}`,
    description: tenant.ownerBio ?? `Outdoor activities and hikes with ${tenant.name} in the UAE.`,
    logo: absImage(tenant.ownerAvatar),
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    ...(rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.value,
            reviewCount: rating.count
          }
        }
      : {})
  };
};

export const faqPageSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer }
  }))
});
