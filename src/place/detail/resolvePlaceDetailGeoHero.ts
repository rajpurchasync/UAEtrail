import type { PlaceDetailKind } from '../../pages/placeDetailConfig';
import type { Place } from '../../types/place';
import { geoNodePath } from '../../config/routingCatalog';
import { browseCatalogHubLabel } from '../../discovery/discoveryPortListPeek';
import { buildPlaceDetailDiscoveryCard } from './buildPlaceDetailDiscoveryCard';
import { resolvePlaceAreaLabelFromTags } from './resolvePlaceAreaFromTags';

export const resolvePlaceDetailGeoHero = (input: {
  kind: PlaceDetailKind;
  place: Place;
  placeId: string;
  detailPath: string;
  shareText: string;
}) => {
  const { place } = input;
  const card = buildPlaceDetailDiscoveryCard(input);
  const hubLabel = browseCatalogHubLabel(card);
  const destinationSlug = place.destinationSlug?.trim() || null;
  const venueId = place.geoRef?.venueId?.trim();
  const geoHubPath = venueId && !destinationSlug ? geoNodePath(venueId) : null;
  const placeHubLabel =
    hubLabel ||
    place.placeHubLabel?.trim() ||
    place.destinationName?.trim() ||
    resolvePlaceAreaLabelFromTags(place.tags) ||
    null;
  return {
    placeHubLabel,
    destinationSlug,
    geoHubPath,
    geoRef: place.geoRef ?? null,
    region: place.region,
  };
};