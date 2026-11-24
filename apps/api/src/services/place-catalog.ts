import {
  isFacilityPlaceKind,
  isPlaceCatalogKind,
  placeKindFromLocationRow,
  type FacilityCatalogQuery,
  type FacilityDTO,
  type LocationDTO,
  type PlaceCatalogQuery,
} from '@uaetrail/shared-types';
import { toFacilityDto } from '../lib/facility-mappers.js';
import { listFacilitiesCatalog } from '../lib/facilities-store.js';
import { buildPlaceRegistry, type PlaceRegistryQuery } from './place-registry.js';

const isPlaceCatalogRow = (dto: LocationDTO): boolean => {
  const kind = placeKindFromLocationRow({
    activityType: dto.activityType,
    tags: dto.tags ?? [],
  });
  if (isFacilityPlaceKind(kind)) return false;
  if (dto.activityType === 'shop') return false;
  return isPlaceCatalogKind(kind);
};

export type PlaceCatalogBuildQuery = PlaceCatalogQuery &
  PlaceRegistryQuery & {
    userId?: string | null;
    platformAdmin?: boolean;
  };

/** Places-only catalog (`segment=place`) for organize pickers and CPC reads. */
export const buildPlaceCatalog = async (query: PlaceCatalogBuildQuery = {}): Promise<LocationDTO[]> => {
  const rows = await buildPlaceRegistry({
    activityType: query.activityType,
    countryCode: query.countryCode,
    userId: query.userId ?? null,
    platformAdmin: query.platformAdmin,
  });

  const segment = query.segment ?? 'place';
  if (segment === 'all') return rows;

  return rows.filter(isPlaceCatalogRow).filter((row) => row.publicationStatus !== 'anchor_only');
};

export const buildFacilityCatalog = async (query: FacilityCatalogQuery = {}): Promise<FacilityDTO[]> => {
  const items = await listFacilitiesCatalog({
    destinationId: query.destinationId,
    onSiteId: query.onSiteId,
    facilityKind: query.facilityKind,
    countryCode: query.countryCode,
    take: 300,
  });
  return items.map(toFacilityDto);
};
