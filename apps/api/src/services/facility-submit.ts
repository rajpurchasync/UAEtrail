import type { FacilityKind } from '@uaetrail/shared-types';
import type { LocationSubmitBody } from '../domain/location-submit.js';
import { LocationStatus } from '../domain/enums.js';
import type { FacilityCreateInput } from '../lib/facilities-store.js';

/** Member amenity submit — `facilities` collection only (no `locations` row). */
export const buildFacilitySubmitInput = (
  body: LocationSubmitBody & { facilityKind: FacilityKind; parentPlaceId?: string | null },
  registeredByUserId: string
): FacilityCreateInput => {
  if (body.latitude == null || body.longitude == null) {
    throw new Error('Pin the facility on the map.');
  }
  return {
    name: body.name.trim(),
    region: body.region.trim(),
    areaId: body.areaId!.trim(),
    areaLabel: body.areaLabel?.trim() || null,
    facilityKind: body.facilityKind,
    parentPlaceId: body.parentPlaceId?.trim() || null,
    description: body.description.trim(),
    latitude: body.latitude,
    longitude: body.longitude,
    images: body.images,
    tags: body.tags ?? [],
    countryCode: body.countryCode?.trim().toUpperCase() || 'AE',
    registeredByUserId,
    status: LocationStatus.DRAFT,
  };
};
