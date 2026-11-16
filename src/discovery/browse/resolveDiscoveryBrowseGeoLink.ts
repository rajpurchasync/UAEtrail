import { areaDetailPath, type GeoRef } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discoveryCardModel';
import { geoNodePath } from '../../config/surfacePaths';

/**
 * L2 location tail tap target — geo destination hub first, else curated area guide.
 * @see docs/NAVIGATION.md (spatial drill)
 */
export const resolveDiscoveryBrowseGeoHubPath = (card: DiscoveryCardModel): string | null => {
  const venueId = card.geoRef?.venueId?.trim();
  if (venueId) return geoNodePath(venueId);

  const slug = card.areaSlug?.trim();
  if (slug) return areaDetailPath(slug);

  return null;
};

export const discoveryCardCarriesGeoRef = (geoRef: GeoRef | null | undefined): boolean =>
  Boolean(geoRef?.venueId?.trim() || geoRef?.areaId?.trim());