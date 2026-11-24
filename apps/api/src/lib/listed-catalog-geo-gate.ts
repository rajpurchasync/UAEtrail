import type { GeoRef } from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';
import { LocationStatus } from '../domain/enums.js';
import type { Location } from '../domain/types.js';
import { resolveStoredDestinationId } from './destination-id-sync.js';

const geoRefReadyForListedCatalog = (geoRef: GeoRef | null | undefined): boolean =>
  Boolean(geoRef?.countryId?.trim() && geoRef.stateId?.trim());

/** Listed catalog places need coords, geoRef, and a destination (MIG-DESTINATION-GEO P4). */
export const assertActiveListedPlaceHasCatalogGeo = (location: Location): void => {
  if (location.status !== LocationStatus.ACTIVE) return;
  if (location.registryListed === false) return;

  const lat = location.latitude;
  const lng = location.longitude;
  if (lat == null || lng == null) {
    throw new ApiError(
      400,
      'place_coords_required',
      'Listed places need a map pin (latitude and longitude) before publish.'
    );
  }
  if (!geoRefReadyForListedCatalog(location.geoRef)) {
    throw new ApiError(
      400,
      'place_georef_required',
      'Listed places need resolved geography (geoRef) before publish — save coordinates and retry.'
    );
  }
  if (!resolveStoredDestinationId(location)) {
    throw new ApiError(
      400,
      'place_destination_required',
      'Listed places must belong to a published destination.'
    );
  }
};