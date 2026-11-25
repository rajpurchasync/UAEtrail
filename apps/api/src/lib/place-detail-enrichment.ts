import type { LocationDTO } from '@uaetrail/shared-types';
import type { Location } from '../domain/types.js';
import { findAreaById } from './areas-store.js';
import { locationHasRegistryCoverImage } from './catalog-registry-cover.js';
import { LocationStatus } from '../domain/enums.js';
import { toLocationDto } from './mappers.js';
import { resolveDestinationId } from '@uaetrail/shared-types';
import { ApiError } from './api-error.js';

export const assertRegistryCoverForPublicPlaceDetail = (location: Location): void => {
  const status = String(location.status).toUpperCase();
  if (status !== LocationStatus.ACTIVE) return;
  if (!locationHasRegistryCoverImage(location)) {
    throw new ApiError(404, 'location_not_found', 'Location not found.');
  }
};

/** Attach curated Destination hub slug/title for consumer links (`destinationHubPath`). */
export const enrichLocationDtoWithAreaHub = async (
  location: Location,
  dto: LocationDTO
): Promise<LocationDTO> => {
  const destinationId = resolveDestinationId(location);
  if (!destinationId) return dto;
  const area = await findAreaById(destinationId);
  if (!area || area.status !== 'published') return dto;
  return {
    ...dto,
    destinationSlug: area.slug,
    destinationName: area.name,
    destinationStatus: area.status,
  };
};

export const toPublicPlaceDetailDto = async (location: Location): Promise<LocationDTO> => {
  assertRegistryCoverForPublicPlaceDetail(location);
  const base = toLocationDto(location);
  return enrichLocationDtoWithAreaHub(location, base);
};
