import type { FacilityDTO } from '@uaetrail/shared-types';

/** Region + place-hub label + curated destination slug for facility detail hero. */
export const resolveFacilityDetailDestinationHero = (
  facility: Pick<FacilityDTO, 'region' | 'placeHubLabel' | 'geoRef'>,
  curatedDestinationSlug?: string | null
): {
  region: string;
  placeHubLabel: string | null;
  destinationSlug: string | null;
} => {
  const region =
    facility.region?.trim() ||
    facility.geoRef?.names?.state?.trim() ||
    facility.geoRef?.names?.country?.trim() ||
    '';
  const placeHubLabel =
    facility.placeHubLabel?.trim() || facility.geoRef?.names?.area?.trim() || null;
  return {
    region,
    placeHubLabel,
    destinationSlug: curatedDestinationSlug?.trim() || null,
  };
};