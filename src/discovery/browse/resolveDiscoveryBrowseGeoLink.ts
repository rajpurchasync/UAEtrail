import { destinationHubPath, isGeographyMapSource, type GeoRef } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discoveryCardModel';
import { geoNodePath } from '../../config/surfacePaths';
import { listDiscoveryPath } from '../discoverySession';

/**
 * L2 location tail tap target — geo destination hub first, else curated area guide.
 * @see docs/NAVIGATION.md (geo tree drill)
 */
export const resolveDiscoveryBrowseGeoHubPath = (card: DiscoveryCardModel): string | null => {
  const venueId = card.geoRef?.venueId?.trim();
  if (venueId) return geoNodePath(venueId);

  const slug = card.destinationSlug?.trim();
  if (slug) return destinationHubPath(slug);

  return null;
};

export const discoveryCardCarriesGeoRef = (geoRef: GeoRef | null | undefined): boolean =>
  Boolean(geoRef?.venueId?.trim() || geoRef?.areaId?.trim());

const geoDrillPathFromRef = (geoRef: GeoRef): string[] => {
  const chain = geoRef.chain?.map((id) => id.trim()).filter(Boolean) ?? [];
  if (chain.length > 0) {
    const withoutCountry = chain.length > 1 ? chain.slice(1) : chain;
    return withoutCountry.slice(0, 3);
  }
  const leaf =
    geoRef.venueId?.trim() ||
    geoRef.areaId?.trim() ||
    geoRef.stateId?.trim() ||
    null;
  return leaf ? [leaf] : [];
};

const listCatForBrowseCard = (card: DiscoveryCardModel): 'activities' | 'venues' => {
  if (card.source === 'activity' || card.source === 'availability') return 'activities';
  if (isGeographyMapSource(card.source) || card.source === 'shop') return 'venues';
  return 'activities';
};

/** Full-screen list scoped to the card's geo tree (`/list?geo=…`). */
export const resolveDiscoveryBrowseGeoListPath = (card: DiscoveryCardModel): string | null => {
  const geoRef = card.geoRef;
  if (!geoRef) return null;
  const geoPath = geoDrillPathFromRef(geoRef);
  if (geoPath.length === 0) return null;
  const listCat = listCatForBrowseCard(card);
  return listDiscoveryPath({
    listCat,
    categories: [listCat],
    geoPath,
  });
};

/** List location tail prefers geo-scoped browse; map peek keeps geo/area hub. */
export const resolveDiscoveryBrowseLocationHref = (
  card: DiscoveryCardModel,
  target: 'hub' | 'list'
): string | null => {
  if (target === 'list') {
    return resolveDiscoveryBrowseGeoListPath(card) ?? resolveDiscoveryBrowseGeoHubPath(card);
  }
  return resolveDiscoveryBrowseGeoHubPath(card);
};