import type { LocationDTO } from '@uaetrail/shared-types';
import { findDestinationsByIds } from './destinations-store.js';

export const withPlaceAreaMetaMany = async (dtos: LocationDTO[]): Promise<LocationDTO[]> => {
  const ids = dtos
    .map((row) => row.destinationId?.trim())
    .filter((id): id is string => Boolean(id));
  const areas = await findDestinationsByIds(ids);
  const byId = new Map(areas.map((area) => [area.id, area]));
  return dtos.map((dto) => {
    const area = dto.destinationId ? byId.get(dto.destinationId) : undefined;
    if (!area) return dto;
    return {
      ...dto,
      destinationName: dto.destinationName ?? area.name,
      destinationSlug: dto.destinationSlug ?? area.slug,
      destinationStatus: area.status,
    };
  });
};

export const withPlaceAreaMeta = async (dto: LocationDTO): Promise<LocationDTO> => {
  const [row] = await withPlaceAreaMetaMany([dto]);
  return row ?? dto;
};
