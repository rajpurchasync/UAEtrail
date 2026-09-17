import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreFeaturedPerson } from '@uaetrail/shared-types';
import { resolveActivityTypeCoverImage } from '../config/activityCoverImages';
import type { ActivityListing } from '../types';
import type { Place } from '../types/place';
import { explorePath, type MapFilterKey } from './exploreRouting';

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

const placeKind = (activityType: Place['activityType']): ExploreMapItemDTO['kind'] => {
  if (activityType === 'camping') return 'camping';
  if (activityType === 'event') return 'event';
  return 'hiking';
};

const placeFilter = (activityType: Place['activityType']): MapFilterKey => {
  if (activityType === 'camping') return 'camping';
  if (activityType === 'event') return 'others';
  return 'hiking';
};

export const placeToExploreItem = (place: Place): ExploreMapItemDTO => ({
  id: `venue:${place.id}`,
  kind: placeKind(place.activityType),
  source: 'venue',
  title: place.name,
  subtitle: place.region,
  latitude: place.latitude ?? null,
  longitude: place.longitude ?? null,
  path: explorePath({ panel: 'venues', filter: placeFilter(place.activityType) }),
  image: place.images[0] ?? null,
  locationCard: {
    id: place.id,
    activityType: place.activityType,
    region: place.region,
    description: place.description,
    difficulty: place.difficulty,
    distance: place.distance,
    duration: place.duration,
    elevation: place.elevation,
    childFriendly: place.childFriendly ?? false,
    accessibility: place.accessibility,
    campingType: place.campingType,
    maxGroupSize: place.maxGroupSize,
    season: place.season ?? [],
    surfaceType: place.surfaceType,
    images: place.images,
    featured: place.featured,
  },
});

/** @deprecated Use {@link placeToExploreItem} */
export const trailToExploreItem = (trail: Omit<Place, 'activityType'>): ExploreMapItemDTO =>
  placeToExploreItem({ ...trail, activityType: 'hiking' });

/** @deprecated Use {@link placeToExploreItem} */
export const campToExploreItem = (
  camp: Omit<Place, 'activityType' | 'distance' | 'duration' | 'elevation' | 'childFriendly'> &
    Partial<Pick<Place, 'distance' | 'duration' | 'elevation' | 'childFriendly'>>
): ExploreMapItemDTO => placeToExploreItem({ ...camp, activityType: 'camping', childFriendly: camp.childFriendly ?? false });
