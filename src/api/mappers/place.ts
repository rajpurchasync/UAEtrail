import type { LocationDTO } from '@uaetrail/shared-types';
import type { Place, PlaceActivityType, PlaceRegion } from '../../types/place';

const mapLocationFields = (location: LocationDTO) => ({
  parkingLat: location.parkingLat,
  parkingLng: location.parkingLng,
  parkingLink: location.parkingLink,
  highlights: location.highlights,
  surfaceType: location.surfaceType,
  tags: location.tags,
  accessibleBy: location.accessibleBy,
});

const toPlaceActivityType = (activityType: LocationDTO['activityType']): PlaceActivityType => {
  if (activityType === 'camping') return 'camping';
  if (activityType === 'event') return 'event';
  return 'hiking';
};

/** Map API/storage Location to unified Place view model. */
export const mapLocationToPlace = (location: LocationDTO): Place => ({
  id: location.id,
  name: location.name,
  region: location.region as PlaceRegion,
  activityType: toPlaceActivityType(location.activityType),
  difficulty: location.difficulty ?? undefined,
  distance: location.distance ?? undefined,
  duration: location.duration ?? undefined,
  elevation: location.elevation ?? undefined,
  season: location.season?.length ? (location.season as Place['season']) : undefined,
  childFriendly: location.childFriendly,
  campingType: location.campingType as Place['campingType'] | undefined,
  maxGroupSize: location.maxGroupSize ?? undefined,
  accessibility: location.accessibility ?? undefined,
  description: location.description,
  images: location.images,
  featured: location.featured,
  latitude: location.latitude,
  longitude: location.longitude,
  status: location.status,
  areaId: location.areaId ?? null,
  areaLabel: location.areaLabel ?? null,
  areaSlug: location.areaSlug ?? null,
  areaName: location.areaName ?? null,
  ...mapLocationFields(location),
});
