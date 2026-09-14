import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreFeaturedPerson } from '@uaetrail/shared-types';
import { resolveActivityTypeCoverImage } from '../config/activityCoverImages';
import type { ActivityListing, CampingSpot, Trail } from '../types';
import { explorePath } from './exploreRouting';

const resolveActivityCover = (activity: ActivityListing, coverVariantIndex?: number): string =>
  resolveActivityTypeCoverImage(activity.activityType, activity.images, {
    activityId: activity.id,
    variantIndex: coverVariantIndex,
  });

const activityKind = (activityType: ActivityListing['activityType']): ExploreMapItemDTO['kind'] => {
  if (activityType === 'camping') return 'camping';
  if (activityType === 'event') return 'event';
  if (activityType === 'carpool') return 'carpool';
  return 'hiking';
};

export const activityListingToExploreItem = (
  activity: ActivityListing,
  coverVariantIndex?: number
): ExploreMapItemDTO => {
  const coverImage = resolveActivityCover(activity, coverVariantIndex);

  return {
    id: `activity:${activity.id}`,
    kind: activityKind(activity.activityType),
    source: 'activity',
    title: activity.title || activity.locationName,
    subtitle: activity.region,
    latitude: activity.latitude ?? null,
    longitude: activity.longitude ?? null,
    path: `/activity/${activity.id}`,
    featuredPerson: activity.hostUserId
      ? buildExploreFeaturedPerson({
          userId: activity.hostUserId,
          displayName: activity.hostName ?? undefined,
          avatarUrl: activity.hostAvatar ?? null,
          role: 'host',
        })
      : null,
    hostName: activity.hostName ?? null,
    hostAvatar: activity.hostAvatar ?? null,
    date: activity.date,
    time: activity.time,
    slotsAvailable: activity.slotsAvailable,
    slotsTotal: activity.slotsTotal,
    participantPreviews: activity.participantPreviews,
    image: coverImage,
    activity: {
      id: activity.id,
      tenantId: activity.operatorId || 'unknown',
      tenantSlug: activity.tenantSlug || 'host',
      locationId: activity.locationId || activity.id,
      locationName: activity.locationName,
      region: activity.region,
      activityType: activity.activityType,
      title: activity.title || activity.locationName,
      description: activity.description || '',
      date: activity.date,
      time: activity.time,
      price: activity.price,
      pricePackages: activity.pricePackages ?? undefined,
      pricingMode: activity.pricingMode ?? undefined,
      slotsTotal: activity.slotsTotal,
      slotsAvailable: activity.slotsAvailable,
      status: 'published',
      images: activity.images?.length ? activity.images : [coverImage],
      meetingPoint: activity.meetingPoint ?? undefined,
      itinerary: activity.itinerary ?? undefined,
      requirements: activity.requirements ?? undefined,
      participantPreviews: activity.participantPreviews,
      hostName: activity.hostName ?? undefined,
      hostUserId: activity.hostUserId ?? undefined,
      hostAvatar: activity.hostAvatar ?? undefined,
      tenantName: activity.tenantName ?? undefined,
    },
  };
};

export const trailToExploreItem = (trail: Trail): ExploreMapItemDTO => ({
  id: `venue:${trail.id}`,
  kind: 'hiking',
  source: 'venue',
  title: trail.name,
  subtitle: trail.region,
  latitude: trail.latitude ?? null,
  longitude: trail.longitude ?? null,
  path: explorePath({ panel: 'venues', filter: 'hiking' }),
  image: trail.images[0] ?? null,
  locationCard: {
    id: trail.id,
    activityType: 'hiking',
    region: trail.region,
    description: trail.description,
    difficulty: trail.difficulty,
    distance: trail.distance,
    duration: trail.duration,
    elevation: trail.elevation,
    childFriendly: trail.childFriendly ?? false,
    season: trail.season ?? [],
    surfaceType: trail.surfaceType,
    images: trail.images,
    featured: trail.featured,
  },
});

export const campToExploreItem = (camp: CampingSpot): ExploreMapItemDTO => ({
  id: `venue:${camp.id}`,
  kind: 'camping',
  source: 'venue',
  title: camp.name,
  subtitle: camp.region,
  latitude: camp.latitude ?? null,
  longitude: camp.longitude ?? null,
  path: explorePath({ panel: 'venues', filter: 'camping' }),
  image: camp.images[0] ?? null,
  locationCard: {
    id: camp.id,
    activityType: 'camping',
    region: camp.region,
    description: camp.description,
    difficulty: camp.difficulty,
    childFriendly: false,
    accessibility: camp.accessibility,
    campingType: camp.campingType,
    maxGroupSize: camp.maxGroupSize,
    season: camp.season ?? [],
    images: camp.images,
    featured: camp.featured,
  },
});
