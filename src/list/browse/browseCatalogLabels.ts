import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';

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

/** Emirate / state — never the place title. */
export const browseCatalogRegionLabel = (card: DiscoveryCardModel): string | null => {
  const nameNorm = browseCatalogNormalize(browseCatalogEntityName(card));
  const region = card.venueRegion?.trim() || null;
  return region && browseCatalogNormalize(region) !== nameNorm ? region : null;
};

/** Place hub (Hatta, Wadi Shawka) — never the title or the emirate again. */
export const browseCatalogHubLabel = (card: DiscoveryCardModel): string | null => {
  const nameNorm = browseCatalogNormalize(browseCatalogEntityName(card));
  const regionPart = browseCatalogRegionLabel(card);
  const hubFromArea =
    card.areaName?.trim() && browseCatalogNormalize(card.areaName) !== nameNorm
      ? card.areaName.trim()
      : null;
  const hubFromSubtitle = card.subtitle?.trim()
    ? stripTrailingRegion(card.subtitle.trim(), regionPart)
    : '';
  const subtitlePart =
    hubFromSubtitle && browseCatalogNormalize(hubFromSubtitle) !== nameNorm ? hubFromSubtitle : null;
  const locationPart = hubFromArea || subtitlePart || null;
  if (
    locationPart &&
    regionPart &&
    browseCatalogNormalize(locationPart) === browseCatalogNormalize(regionPart)
  ) {
    return null;
  }
  return locationPart;
};

/** Emirate · place hub — never “Hiking trail location”. */
export const browseCatalogHeaderLocationLine = (card: DiscoveryCardModel): string | null => {
  const regionPart = browseCatalogRegionLabel(card);
  const hubPart = browseCatalogHubLabel(card);
  if (regionPart && hubPart) return `${regionPart} · ${hubPart}`;
  return hubPart || regionPart || null;
};