import type { PlaceDetailKind } from '../../pages/placeDetailConfig';
import type { Place } from '../../types/place';
import { geoNodePath } from '../../config/routingCatalog';
import { browseCatalogHubLabel } from '../../list/browse/browseCatalogLabels';
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
  const areaSlug = place.areaSlug?.trim() || null;
  const venueId = place.geoRef?.venueId?.trim();
  const geoHubPath = venueId && !areaSlug ? geoNodePath(venueId) : null;
  const areaLabel =
    hubLabel ||
    place.areaLabel?.trim() ||
    place.areaName?.trim() ||
    resolvePlaceAreaLabelFromTags(place.tags) ||
    null;
  return {
    areaLabel,
    areaSlug,
    geoHubPath,
    geoRef: place.geoRef ?? null,
    region: place.region,
  };
};