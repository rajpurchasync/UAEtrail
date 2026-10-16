import type { Location } from '../domain/types.js';
import {
  facilityDetailPath,
  PLACE_KIND_LABELS,
  type PlaceNearbyFacilityDTO,
} from '@uaetrail/shared-types';
import { listFacilitiesByParentPlaceId } from './facilities-store.js';

const NEARBY_FACILITY_LIMIT = 16;

/** Amenities scoped to a place via `parentPlaceId` (`facilities` collection). */
export const listNearbyFacilitiesForPlace = async (
  location: Location
): Promise<PlaceNearbyFacilityDTO[]> => {
  const rows = await listFacilitiesByParentPlaceId(location.id, NEARBY_FACILITY_LIMIT);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    placeKind: row.facilityKind,
    label: PLACE_KIND_LABELS[row.facilityKind],
    path: facilityDetailPath(row.id),
  }));
};
