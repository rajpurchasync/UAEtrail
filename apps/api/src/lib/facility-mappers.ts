import type { FacilityDTO } from '@uaetrail/shared-types';
import type { Facility } from '../domain/facility.js';

export const toFacilityDto = (facility: Facility): FacilityDTO => ({
  id: facility.id,
  name: facility.name,
  region: facility.region,
  areaLabel: facility.areaLabel,
  areaId: facility.areaId,
  geoRef: facility.geoRef ?? null,
  facilityKind: facility.facilityKind,
  parentPlaceId: facility.parentPlaceId ?? null,
  venueId: facility.venueId ?? null,
  description: facility.description,
  latitude: facility.latitude,
  longitude: facility.longitude,
  images: facility.images,
  partnerReferralUrl: facility.partnerReferralUrl ?? null,
  tags: facility.tags,
  status: facility.status,
  moderationStatus: facility.moderationStatus,
  publicationStatus: facility.publicationStatus,
  registeredByUserId: facility.registeredByUserId ?? facility.submittedById ?? null,
  submittedById: facility.submittedById ?? null,
  createdAt: facility.createdAt.toISOString(),
  updatedAt: facility.updatedAt.toISOString(),
  amenityState: facility.amenityState,
  amenityLastCheckedAt: facility.amenityLastCheckedAt
    ? facility.amenityLastCheckedAt.toISOString()
    : null,
});
