import type { ExploreLocationCardDTO, ExploreMapItemDTO, ExploreMapKind } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { PlaceDetailKind } from '../../pages/placeDetailConfig';
import { PLACE_DETAIL_CONFIG } from '../../pages/placeDetailConfig';
import type { Place } from '../../types/place';

const placeDetailExploreKind = (kind: PlaceDetailKind): ExploreMapKind => {
  const activityType = PLACE_DETAIL_CONFIG[kind].activityType;
  if (activityType === 'camping') return 'camping';
  if (activityType === 'event') return 'event';
  return 'hiking';
};

const locationCardFromPlace = (place: Place, placeId: string): ExploreLocationCardDTO => ({
  id: placeId,
  activityType: place.activityType,
  region: place.region,
  description: place.description?.slice(0, 2000) ?? '',
  images: place.images ?? [],
  featured: place.featured,
  childFriendly: place.childFriendly ?? false,
  season: place.season?.length ? [...place.season] : [],
  ...(place.difficulty ? { difficulty: place.difficulty } : {}),
  ...(place.distance != null ? { distance: place.distance } : {}),
  ...(place.duration != null ? { duration: place.duration } : {}),
  ...(place.elevation != null ? { elevation: place.elevation } : {}),
  ...(place.campingType ? { campingType: place.campingType } : {}),
  ...(place.maxGroupSize != null ? { maxGroupSize: place.maxGroupSize } : {}),
  ...(place.accessibility ? { accessibility: place.accessibility } : {}),
  ...(place.surfaceType?.length ? { surfaceType: place.surfaceType } : {}),
  ...(place.parkingLat != null ? { parkingLat: place.parkingLat } : {}),
  ...(place.parkingLng != null ? { parkingLng: place.parkingLng } : {}),
});

/** Discovery card for place detail — wishlist / trip alerts parity with map peek. */
export const buildPlaceDetailDiscoveryCard = (input: {
  kind: PlaceDetailKind;
  place: Place;
  placeId: string;
  detailPath: string;
  shareText: string;
}): DiscoveryCardModel => {
  const { kind, place, placeId, detailPath, shareText } = input;
  const mapKind = placeDetailExploreKind(kind);
  const lat = place.latitude ?? place.parkingLat ?? null;
  const lng = place.longitude ?? place.parkingLng ?? null;
  const item = {
    id: `venue:${placeId}`,
    kind: mapKind,
    source: 'venue',
    title: place.name?.trim() || 'Place',
    latitude: lat,
    longitude: lng,
    path: detailPath,
    image: place.images?.[0] ?? null,
    subtitle: place.areaLabel?.trim() || place.region,
    areaId: place.areaId ?? undefined,
    areaSlug: place.areaSlug ?? undefined,
    areaLabel: place.areaLabel ?? undefined,
    areaName: place.areaName ?? undefined,
    geoRef: place.geoRef ?? null,
    venueRegion: place.region,
    locationCard: locationCardFromPlace(place, placeId),
  } as ExploreMapItemDTO;
  const card = buildDiscoveryCardViewModelCard(item);
  return { ...card, shareTitle: place.name?.trim() || card.shareTitle, shareText, sharePath: detailPath };

};
