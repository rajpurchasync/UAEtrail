import type { LocationDTO } from '@uaetrail/shared-types';
import { findAreasByIds } from './areas-store.js';

export const withPlaceAreaMetaMany = async (dtos: LocationDTO[]): Promise<LocationDTO[]> => {
  const ids = dtos
    .map((row) => row.areaId?.trim())
    .filter((id): id is string => Boolean(id));
  const areas = await findAreasByIds(ids);
  const byId = new Map(areas.map((area) => [area.id, area]));
  return dtos.map((dto) => {
    const area = dto.areaId ? byId.get(dto.areaId) : undefined;
    if (!area) return dto;
    return {
      ...dto,
      areaName: dto.areaName ?? area.name,
      areaSlug: dto.areaSlug ?? area.slug,
      areaStatus: area.status,
    };
  });
};

export const withPlaceAreaMeta = async (dto: LocationDTO): Promise<LocationDTO> => {
  const [row] = await withPlaceAreaMetaMany([dto]);
  return row ?? dto;
};
