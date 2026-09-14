import { ActivityDetailDTO, ProductDTO, ReviewDTO } from '@uaetrail/shared-types';
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, toAbsoluteUrl } from '../../config/seo';
import { CampingSpot, Trail, CommunityActivitySpot } from '../../types';
import type { TenantProfile } from '../../api/services';
import { activityHostName } from '../../utils/hostLabels';
import { explorePlacesPath } from '../../utils/exploreRouting';

const absImage = (url?: string | null) => toAbsoluteUrl(url) ?? undefined;

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_ORIGIN,
  description: SITE_DESCRIPTION,
  hasPart: {
    '@type': 'WebPage',
    name: 'Frequently asked questions',
    url: `${SITE_ORIGIN}/faq`,
    description: 'Answers about hiking, camping, and organized outdoor activities in the UAE.'
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_ORIGIN}${explorePlacesPath()}&q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
});

const locationAddress = (region?: string) => ({
  '@type': 'PostalAddress' as const,
  addressCountry: 'AE',
  addressRegion: region ?? 'UAE'
});

export const trailSchema = (trail: Trail) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  name: trail.name,
  description: trail.description,
  url: `${SITE_ORIGIN}/trail/${trail.id}`,
  image: absImage(trail.images?.[0]),
  address: locationAddress(trail.region),
  geo:
    trail.latitude != null && trail.longitude != null
      ? { '@type': 'GeoCoordinates', latitude: trail.latitude, longitude: trail.longitude }
      : undefined,
  touristType: 'Hiker',
  additionalProperty: [
    trail.difficulty
      ? { '@type': 'PropertyValue', name: 'difficulty', value: trail.difficulty }
      : null,
    trail.distance != null && trail.distance > 0
      ? { '@type': 'PropertyValue', name: 'distanceKm', value: trail.distance }
      : null,
    { '@type': 'PropertyValue', name: 'region', value: trail.region },
  ].filter(Boolean),
});

export const eventVenueSchema = (event: CommunityActivitySpot) => ({
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  name: event.name,
  description: event.description,
  url: `${SITE_ORIGIN}/event/${event.id}`,
  image: absImage(event.images?.[0]),
  address: locationAddress(event.region),
  geo:
    event.latitude != null && event.longitude != null
      ? { '@type': 'GeoCoordinates', latitude: event.latitude, longitude: event.longitude }
      : undefined,
  touristType: 'Outdoor event venue',
  additionalProperty: [{ '@type': 'PropertyValue', name: 'region', value: event.region }],
});

export const campSchema = (camp: CampingSpot) => ({
  '@context': 'https://schema.org',
  '@type': 'Campground',
  name: camp.name,
  description: camp.description,
  url: `${SITE_ORIGIN}/camp/${camp.id}`,
  image: absImage(camp.images?.[0]),
  address: locationAddress(camp.region),
  geo:
    camp.latitude != null && camp.longitude != null
      ? { '@type': 'GeoCoordinates', latitude: camp.latitude, longitude: camp.longitude }
      : undefined,
  additionalProperty: [
    { '@type': 'PropertyValue', name: 'campingType', value: camp.campingType },
    { '@type': 'PropertyValue', name: 'region', value: camp.region }
  ]
});

export const activityEventSchema = (activity: ActivityDetailDTO) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: activity.title || activity.locationName,
  description: activity.description,
  url: `${SITE_ORIGIN}/activity/${activity.id}`,
  image: absImage(activity.images?.[0] ?? activity.location?.images?.[0]),
  startDate: `${activity.date}T${activity.time}:00+04:00`,
  endDate: activity.endDate ? `${activity.endDate}T${activity.endTime ?? activity.time}:00+04:00` : undefined,
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  ActivityStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'Place',
    name: activity.locationName,
    address: locationAddress(activity.location?.region)
  },
  organizer: {
    '@type': 'Organization',
    name: activityHostName(activity),
    url: activity.tenantSlug ? `${SITE_ORIGIN}/operator/${activity.tenantSlug}` : undefined
  },
  offers: {
    '@type': 'Offer',
    price: activity.price,
    priceCurrency: 'AED',
    availability:
      activity.slotsAvailable > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    url: `${SITE_ORIGIN}/activity/${activity.id}`
  }
});

export const productSchema = (
  product: ProductDTO & { merchant?: { shopName?: string } }
) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  url: `${SITE_ORIGIN}/product/${product.id}`,
  image: absImage(product.images?.[0]),
  brand: product.merchant?.shopName
    ? { '@type': 'Brand', name: product.merchant.shopName }
    : undefined,
  offers: {
    '@type': 'Offer',
    price: product.priceAed,
    priceCurrency: 'AED',
    availability: 'https://schema.org/InStock',
    url: `${SITE_ORIGIN}/product/${product.id}`
  }
});

const averageRating = (reviews: ReviewDTO[]) => {
  if (reviews.length === 0) return undefined;
  const value = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { value: Math.round(value * 10) / 10, count: reviews.length };
};

export const organizationSchema = (
  tenant: TenantProfile,
  slug: string,
  reviews: ReviewDTO[] = []
) => {
  const rating = averageRating(reviews);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: tenant.name,
    url: `${SITE_ORIGIN}/operator/${slug}`,
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
