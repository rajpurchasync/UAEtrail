import type { GeoRef } from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';
import { LocationStatus } from '../domain/enums.js';
import type { Facility } from '../domain/facility.js';
import type { Location } from '../domain/types.js';
import { resolveDestinationId } from '@uaetrail/shared-types';

const geoRefReadyForListedCatalog = (geoRef: GeoRef | null | undefined): boolean =>
  Boolean(geoRef?.countryId?.trim() && geoRef?.stateId?.trim());

type ListedCatalogGeoEntity = 'place' | 'facility';

type ListedCatalogGeoRow = {
  status: LocationStatus;
  registryListed?: boolean;
  latitude: number | null;
  longitude: number | null;
  geoRef?: GeoRef | null;
  destinationId?: string | null;
};

const assertActiveListedCatalogHasGeo = (row: ListedCatalogGeoRow, entity: ListedCatalogGeoEntity): void => {
  if (row.status !== LocationStatus.ACTIVE) return;
  if (row.registryListed === false) return;

  const prefix = entity === 'place' ? 'place' : 'facility';
  const lat = row.latitude;
  const lng = row.longitude;
  if (lat == null || lng == null) {
    throw new ApiError(
      400,
      `${prefix}_coords_required`,
      `Listed ${entity === 'place' ? 'places' : 'facilities'} need a map pin (latitude and longitude) before publish.`
    );
  }
  if (!geoRefReadyForListedCatalog(row.geoRef)) {
    throw new ApiError(
      400,
      `${prefix}_georef_required`,
      `Listed ${entity === 'place' ? 'places' : 'facilities'} need resolved geography (geoRef) before publish — save coordinates and retry.`
    );
  }
  if (!resolveDestinationId(row)) {
    throw new ApiError(
      400,
      `${prefix}_destination_required`,
      `Listed ${entity === 'place' ? 'places' : 'facilities'} must belong to a published destination.`
    );
  }
};

/** Listed catalog places need coords, geoRef, and a destination (MIG-DESTINATION-GEO P4). */
export const assertActiveListedPlaceHasCatalogGeo = (location: Location): void => {
  assertActiveListedCatalogHasGeo(location, 'place');
};

/** Listed catalog facilities — same invariants as places (MIG-DESTINATION-GEO P6). */
export const assertActiveListedFacilityHasCatalogGeo = (facility: Facility): void => {
  assertActiveListedCatalogHasGeo(facility, 'facility');
};