import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { browseCatalogHeaderLocationLine } from '../discovery/discoveryPortListCatalogLabels';
import {
  distanceMeters,
  formatPlaceDistance,
  type ViewerFix,
} from '../discovery/discoveryPortListBrowseFacts';

const joinMetaParts = (parts: (string | null | undefined)[]): string | null => {
  const next = parts.map((p) => p?.trim()).filter((p): p is string => Boolean(p));
  return next.length > 0 ? next.join(' · ') : null;
};

const driveAwayLabel = (card: DiscoveryCardModel, viewer: ViewerFix | null | undefined): string | null => {
  if (!viewer || card.mapLatitude == null || card.mapLongitude == null) return null;
  const meters = distanceMeters(viewer, card.mapLatitude, card.mapLongitude);
  return `${formatPlaceDistance(meters, 'metric')} away`;
};

/** Map peek — distance + emirate · place hub (not trail stats or duplicate title). */
export const resolvePlaceMapPeekMetaLine = (
  card: DiscoveryCardModel,
  viewer?: ViewerFix | null
): string | null => {
  const away = driveAwayLabel(card, viewer);
  const hubLine = browseCatalogHeaderLocationLine(card);

  return joinMetaParts([away, hubLine]);
};