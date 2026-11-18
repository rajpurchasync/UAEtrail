import type { FacilityDTO } from '@uaetrail/shared-types';

export const resolveFacilityDetailAreaHero = (
  facility: Pick<FacilityDTO, 'region' | 'areaLabel' | 'geoRef'>,
  curatedAreaSlug?: string | null
): {
  region: string;
  areaLabel: string | null;
  areaSlug: string | null;
} => {
  const region =
    facility.region?.trim() ||
    facility.geoRef?.names?.state?.trim() ||
    facility.geoRef?.names?.country?.trim() ||
    '';
  const areaLabel =
    facility.areaLabel?.trim() || facility.geoRef?.names?.area?.trim() || null;
  return {
    region,
    areaLabel,
    areaSlug: curatedAreaSlug?.trim() || null,
  };
};
