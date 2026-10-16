import type { FacilityDTO } from '@uaetrail/shared-types';
import type { Facility } from '../domain/facility.js';

export const toFacilityDto = (facility: Facility): FacilityDTO => ({
  id: facility.id,
  name: facility.name,
  region: facility.region,
  areaLabel: facility.areaLabel,
  areaId: facility.areaId,
  facilityKind: facility.facilityKind,
  parentPlaceId: facility.parentPlaceId ?? null,
  description: facility.description,
  latitude: facility.latitude,
  longitude: facility.longitude,
  images: facility.images,
  tags: facility.tags,
  status: facility.status,
  moderationStatus: facility.moderationStatus,
  publicationStatus: facility.publicationStatus,
  registeredByUserId: facility.registeredByUserId ?? facility.submittedById ?? null,
  submittedById: facility.submittedById ?? null,
  createdAt: facility.createdAt.toISOString(),
  updatedAt: facility.updatedAt.toISOString(),
});
