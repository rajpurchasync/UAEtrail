import {
  isGeographyMapSource,
  type DiscoveryCardSource,
  type ExploreMapItemDTO,
  type GeoRef,
} from '@uaetrail/shared-types';
import { groupRegionTextAtBrowseFilterLevel } from '../config/groupRegionFilter';

export type ExploreCatalogHubLabelInput = {
  listTitle?: string | null;
  headline?: string | null;
  areaId?: string | null;
  areaLabel?: string | null;
  areaName?: string | null;
  subtitle?: string | null;
  venueRegion?: string | null;
  geoRef?: GeoRef | null;
  source?: DiscoveryCardSource;
};

const normalize = (value: string | null | undefined): string =>
  value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';

const entityName = (card: Pick<ExploreCatalogHubLabelInput, 'listTitle' | 'headline'>): string => {
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
  if (normalize(value) === normalize(region)) return '';
  return value;
};

const rejectIfEntityTitle = (
  value: string | null | undefined,
  card: Pick<ExploreCatalogHubLabelInput, 'listTitle' | 'headline'>
): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const nameNorm = normalize(entityName(card));
  return normalize(trimmed) !== nameNorm ? trimmed : null;
};

const distinctFromRegion = (value: string, regionPart: string | null): boolean =>
  !regionPart || normalize(value) !== normalize(regionPart);

const regionLabel = (card: ExploreCatalogHubLabelInput): string | null => {
  const nameNorm = normalize(entityName(card));
  const fromGeo = card.geoRef?.names.state?.trim();
  if (fromGeo && normalize(fromGeo) !== nameNorm) return fromGeo;
  const region = card.venueRegion?.trim() || null;
  return region && normalize(region) !== nameNorm ? region : null;
};

/** Geo destination for browse L2 — never spot title or `locationName`. */
export const exploreCatalogHubLabel = (card: ExploreCatalogHubLabelInput): string | null => {
  const regionPart = regionLabel(card);
  const reject = (v: string | null | undefined) => rejectIfEntityTitle(v, card);

  const fromGeoVenue = reject(card.geoRef?.names.venue);
  if (fromGeoVenue && distinctFromRegion(fromGeoVenue, regionPart)) return fromGeoVenue;

  const fromGeoArea = reject(card.geoRef?.names.area);
  if (fromGeoArea && distinctFromRegion(fromGeoArea, regionPart)) return fromGeoArea;

  const fromPlaceHub = reject(card.areaLabel?.trim());
  if (fromPlaceHub && distinctFromRegion(fromPlaceHub, regionPart)) return fromPlaceHub;

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

/** Map pin “where” + list tail from explore wire — geo / place-hub, not spot or `locationName`. */
export const exploreCatalogHubLabelFromExploreItem = (item: ExploreMapItemDTO): string | null => {
  const venueRegion =
    groupRegionTextAtBrowseFilterLevel(item.groupRegionLevels) ??
    groupRegionTextAtBrowseFilterLevel(item.locationCard?.groupRegionLevels) ??
    groupRegionTextAtBrowseFilterLevel(item.activity?.groupRegionLevels) ??
    item.locationCard?.region?.trim() ??
    item.activity?.region?.trim() ??
    null;

  return exploreCatalogHubLabel({
    listTitle: item.presentation?.listTitle ?? item.title,
    headline: item.presentation?.headline ?? item.title,
    areaId: item.areaId ?? null,
    areaLabel: item.areaLabel ?? null,
    areaName: item.areaName ?? null,
    subtitle: item.subtitle ?? item.presentation?.subtitle ?? null,
    venueRegion,
    geoRef: item.geoRef ?? item.activity?.geoRef ?? null,
    source: item.source,
  });
};