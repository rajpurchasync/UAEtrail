export type ActivityPublicSeoFields = {
  id: string;
  activityType: string;
  title?: string | null;
  locationName?: string | null;
  region?: string | null;
  date?: string | null;
  time?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  price?: number | null;
  slotsAvailable?: number | null;
  images?: string[] | null;
  bannerUrl?: string | null;
  hostName?: string | null;
  tenantName?: string | null;
  location?: { images?: string[] | null; region?: string | null } | null;
};

/** Public OG/meta copy — no meeting point, coordinates, or full host notes. */
export const activityPublicMetaDescription = (
  activity: Pick<ActivityPublicSeoFields, 'activityType' | 'title' | 'locationName' | 'region'>
): string => {
  const label = activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan';
  const where = activity.region?.trim();
  return where
    ? `Join ${label} in ${where} on UAE Trail — find your crew and get outside together.`
    : `Join this ${activity.activityType} outing on UAE Trail — find your crew and get outside together.`;
};

const locationAddress = (region?: string | null) => ({
  '@type': 'PostalAddress' as const,
  addressCountry: 'AE',
  addressRegion: region?.trim() || 'UAE',
});

const absImage = (siteOrigin: string, url?: string | null): string | undefined => {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${siteOrigin.replace(/\/$/, '')}${path}`;
};

const pickEventImage = (siteOrigin: string, activity: ActivityPublicSeoFields): string | undefined =>
  absImage(siteOrigin, activity.images?.[0] ?? activity.location?.images?.[0] ?? activity.bannerUrl);

const hostDisplayName = (activity: ActivityPublicSeoFields): string =>
  activity.hostName?.trim() || activity.tenantName?.trim() || 'UAE Trail host';

/** Schema.org Event JSON-LD for activity detail + crawler HTML (region-only location). */
export const buildActivityEventJsonLd = (
  activity: ActivityPublicSeoFields,
  siteOrigin: string
): Record<string, unknown> => {
  const origin = siteOrigin.replace(/\/$/, '');
  const canonicalUrl = `${origin}/activity/${activity.id}`;
  const image = pickEventImage(origin, activity);

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: activity.title?.trim() || activity.locationName?.trim() || 'Outdoor plan',
    description: activityPublicMetaDescription(activity),
    url: canonicalUrl,
    image,
    startDate: activity.date && activity.time ? `${activity.date}T${activity.time}:00+04:00` : activity.date,
    endDate:
      activity.endDate && activity.date
        ? `${activity.endDate}T${activity.endTime ?? activity.time ?? '23:59'}:00+04:00`
        : undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: activity.region?.trim() || activity.locationName?.trim() || 'UAE',
      address: locationAddress(activity.region ?? activity.location?.region),
    },
    organizer: {
      '@type': 'Organization',
      name: hostDisplayName(activity),
    },
    offers: {
      '@type': 'Offer',
      price: activity.price ?? 0,
      priceCurrency: 'AED',
      availability:
        (activity.slotsAvailable ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      url: canonicalUrl,
    },
  };
};
