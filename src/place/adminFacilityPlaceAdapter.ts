import type { FacilityDTO, PlaceDTO, PlaceKind } from '@uaetrail/shared-types';
import { placeKindFromLocationRow, tagsForPlaceKind } from '@uaetrail/shared-types';

/** Map a facility catalog row into the admin Places console shape. */
export const facilityDtoToAdminPlaceRow = (facility: FacilityDTO): PlaceDTO => ({
  id: facility.id,
  name: facility.name,
  region: facility.region,
  areaLabel: facility.areaLabel ?? null,
  destinationId: facility.destinationId,
  activityType: 'event',
  description: facility.description ?? '',
  difficulty: 'moderate',
  season: ['year-round'],
  childFriendly: false,
  images: facility.images ?? [],
  featured: false,
  status: (facility.status as PlaceDTO['status']) ?? 'draft',
  latitude: facility.latitude,
  longitude: facility.longitude,
  highlights: [],
  surfaceType: [],
  tags: facility.tags?.length ? facility.tags : tagsForPlaceKind(facility.facilityKind),
  accessibleBy: [],
  countryCode: 'AE',
});

export const adminPlaceFormToFacilityPayload = (
  form: Partial<PlaceDTO>,
  facilityKind: PlaceKind
): Partial<FacilityDTO> & { facilityKind: FacilityDTO['facilityKind'] } => ({
  name: form.name?.trim() ?? '',
  region: form.region?.trim() ?? '',
  areaLabel: form.areaLabel ?? null,
  destinationId: form.destinationId?.trim() ?? '',
  facilityKind: facilityKind as FacilityDTO['facilityKind'],
  description: form.description?.trim() ?? '',
  latitude: form.latitude ?? null,
  longitude: form.longitude ?? null,
  images: form.images ?? [],
  tags: form.tags ?? tagsForPlaceKind(facilityKind),
  status: form.status ?? 'draft',
});

export const facilityKindFromAdminPlaceForm = (form: Partial<PlaceDTO>): PlaceKind | null => {
  const kind = placeKindFromLocationRow({
    activityType: form.activityType ?? 'event',
    tags: form.tags ?? [],
  });
  return kind;
};
