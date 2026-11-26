import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import { discoveryCardHasMapCoords } from '../discovery/discoveryCardModel';
import { browseCatalogEntityName } from '../discovery/discoveryPortListBrowseFacts';
import { resolvePlaceRegistryCoverUrl } from './peek/resolvePlaceRegistryCoverImage';
import { resolvePlacePeekCuratedDestination } from './placePeekPresentation';
import type { ViewerFix } from '../discovery/discoveryPortListBrowseFacts';
import { resolvePlaceMapPeekKindLabel } from './resolvePlaceMapPeekKindLabel';
import { resolvePlaceMapPeekMetaLine } from './resolvePlaceMapPeekMetaLine';
import { resolvePlaceMapPeekAmenityChips } from './resolvePlaceMapPeekAmenityChips';

/** Map venue peek — presentation bundle for compact layout. */
export const resolvePlaceMapPeekViewModel = (
  card: DiscoveryCardModel,
  viewer?: ViewerFix | null
) => {
  const hasDirections =
    discoveryCardHasMapCoords(card) &&
    card.mapLatitude != null &&
    card.mapLongitude != null;

  const curated = resolvePlacePeekCuratedDestination(card);

  return {
    title: browseCatalogEntityName(card),
    kindLabel: resolvePlaceMapPeekKindLabel(card),
    coverUrl: resolvePlaceRegistryCoverUrl(card),
    emoji: card.emoji?.trim() || '📍',
    thumbBadge: curated?.name ?? null,
    metaLine: resolvePlaceMapPeekMetaLine(card, viewer),
    amenityChips: resolvePlaceMapPeekAmenityChips(card),
    averageRating: card.averageRating ?? null,
    reviewCount: card.reviewCount ?? 0,
    hasDirections,
    lat: card.mapLatitude ?? null,
    lng: card.mapLongitude ?? null,
    detailPath: card.path,
    locationId: card.locationId ?? null,
  };
};