import type { PlaceDetailKind, PlaceDetailKindConfig } from '../../pages/placeDetailConfig';
import { PLACE_DETAIL_CONFIG } from '../../pages/placeDetailConfig';
import type { Place } from '../../types/place';
import { hasPositiveNumber, isDefaultVenueSeason } from '../../utils/venueDetailDisplay';

export type PlaceDetailBackKind = 'trail' | 'camp' | 'event';

export type PlaceDetailPageModel = {
  kind: PlaceDetailKind;
  config: PlaceDetailKindConfig;
  backKind: PlaceDetailBackKind;
  shareText: string;
  showSeason: boolean;
};

export const resolvePlaceDetailBackKind = (kind: PlaceDetailKind): PlaceDetailBackKind =>
  kind === 'trail' ? 'trail' : kind === 'camp' ? 'camp' : 'event';

export const buildPlaceDetailPageModel = (input: {
  kind: PlaceDetailKind;
  place: Pick<Place, 'region' | 'distance' | 'season'>;
  config?: PlaceDetailKindConfig;
}): PlaceDetailPageModel => {
  const config = input.config ?? PLACE_DETAIL_CONFIG[input.kind];
  const backKind = resolvePlaceDetailBackKind(input.kind);
  const shareText =
    input.kind === 'trail' && hasPositiveNumber(input.place.distance)
      ? `${input.place.region} · ${input.place.distance} km trail on UAE Trails`
      : `${input.place.region} · ${config.shareSuffix}`;
  const showSeason = Boolean(input.place.season && !isDefaultVenueSeason(input.place.season));

  return {
    kind: input.kind,
    config,
    backKind,
    shareText,
    showSeason,
  };
};
