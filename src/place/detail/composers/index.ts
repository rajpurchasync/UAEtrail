import type { ComponentType } from 'react';
import type { PlaceDetailKind } from '../../../pages/placeDetailConfig';
import { CampPlaceDetailHeroStats } from './CampPlaceDetailHeroStats';
import { EventPlaceDetailHeroStats } from './EventPlaceDetailHeroStats';
import { TrailPlaceDetailHeroStats } from './TrailPlaceDetailHeroStats';
import type { PlaceDetailHeroKindSectionProps } from './placeDetailHeroKindSectionProps';

export type PlaceDetailHeroKindSectionComponent = ComponentType<PlaceDetailHeroKindSectionProps>;

export const PLACE_DETAIL_HERO_KIND_SECTIONS: Record<
  PlaceDetailKind,
  PlaceDetailHeroKindSectionComponent
> = {
  trail: TrailPlaceDetailHeroStats,
  camp: CampPlaceDetailHeroStats,
  event: EventPlaceDetailHeroStats,
};

export const placeDetailHeroKindSectionForKind = (
  kind: PlaceDetailKind
): PlaceDetailHeroKindSectionComponent => PLACE_DETAIL_HERO_KIND_SECTIONS[kind];
