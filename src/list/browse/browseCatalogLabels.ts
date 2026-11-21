import { isGeographyMapSource } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { groupRegionTextAtBrowseFilterLevel } from '../../config/groupRegionFilter';

export const browseCatalogNormalize = (value: string | null | undefined): string =>
  value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';

export const browseCatalogEntityName = (card: DiscoveryCardModel): string => {
  const listTitle = card.listTitle?.trim();
  if (listTitle) return listTitle;
  const headline = card.headline?.trim();
  if (headline) return headline.split(' - ')[0]?.trim() || headline;
  return 'Outdoor place';
};

const stripTrailingRegion = (value: string, region: string | null): string => {
  if (!region) return value;
  const suffix = ` · ${region}`;
  if (value.endsWith(suffix)) return value.slice(0, -suffix.length).trim();
  if (browseCatalogNormalize(value) === browseCatalogNormalize(region)) return '';
  return value;
};

const rejectIfEntityTitle = (
  value: string | null | undefined,
  card: Pick<DiscoveryCardModel, 'listTitle' | 'headline'>
): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const nameNorm = browseCatalogNormalize(browseCatalogEntityName(card as DiscoveryCardModel));
  return browseCatalogNormalize(trimmed) !== nameNorm ? trimmed : null;
};

const distinctFromRegion = (value: string, regionPart: string | null): boolean =>
  !regionPart || browseCatalogNormalize(value) !== browseCatalogNormalize(regionPart);

/**
 * State (geo L2 / emirate) for browse tail — never catalog leaf title.
 * @see `GeoRef.names.state` · `groupRegionLevels`
 */
export const browseCatalogRegionLabel = (card: DiscoveryCardModel): string | null => {
  const nameNorm = browseCatalogNormalize(browseCatalogEntityName(card));
  const fromGeo = card.geoRef?.names.state?.trim();
  if (fromGeo && browseCatalogNormalize(fromGeo) !== nameNorm) return fromGeo;
  const region = card.venueRegion?.trim() || null;
  return region && browseCatalogNormalize(region) !== nameNorm ? region : null;
};

/**
 * Geo destination for L2 browse (geo L4 venue → L3 area → catalog `areaLabel`).
 * Never trail/camp **spot** title (`listTitle` / activity `locationName`).
 * @see `docs/DOMAIN_CANONICALS.md` §12.1.2 · `geo-hierarchy.ts`
 */
export const browseCatalogHubLabel = (card: DiscoveryCardModel): string | null => {
  const regionPart = browseCatalogRegionLabel(card);
  const reject = (v: string | null | undefined) => rejectIfEntityTitle(v, card);

  const fromGeoVenue = reject(card.geoRef?.names.venue);
  if (fromGeoVenue && distinctFromRegion(fromGeoVenue, regionPart)) return fromGeoVenue;

  const fromGeoArea = reject(card.geoRef?.names.area);
  if (fromGeoArea && distinctFromRegion(fromGeoArea, regionPart)) return fromGeoArea;

  const fromPlaceHub = reject(card.areaLabel?.trim());
  if (fromPlaceHub && distinctFromRegion(fromPlaceHub, regionPart)) return fromPlaceHub;

  // Legacy wire: `areaName` carried place-hub before `areaLabel`; skip when `areaId` is curated Area.
  if (!card.areaId?.trim()) {
    const fromLegacy = reject(card.areaName?.trim());
    if (fromLegacy && distinctFromRegion(fromLegacy, regionPart)) return fromLegacy;
  }

  if (isGeographyMapSource(card.source) && card.source !== 'activity') {
    const hubFromSubtitle = card.subtitle?.trim()
      ? stripTrailingRegion(card.subtitle.trim(), regionPart)
      : '';
    const subtitlePart = reject(hubFromSubtitle);
    if (subtitlePart && distinctFromRegion(subtitlePart, regionPart)) return subtitlePart;
  }

  return null;
};

export { exploreCatalogHubLabelFromExploreItem as browseCatalogHubLabelFromExploreItem } from '../../explore/exploreCatalogHubLabel';

/** State · geo destination — never spot title or generic venue hint. */
export const browseCatalogHeaderLocationLine = (card: DiscoveryCardModel): string | null => {
  const regionPart = browseCatalogRegionLabel(card);
  const hubPart = browseCatalogHubLabel(card);
  if (regionPart && hubPart) return `${regionPart} · ${hubPart}`;
  return hubPart || regionPart || null;
};