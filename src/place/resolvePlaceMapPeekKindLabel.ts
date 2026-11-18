import { isGeographyMapSource, PLACE_KIND_LABELS, type PlaceKind } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';

const OUTING_KIND_LABEL: Record<string, string> = {
  hiking: 'Trail',
  camping: 'Camp',
  event: 'Event venue',
};

/** Venue type pill — park, trail, facility kind, … */
export const resolvePlaceMapPeekKindLabel = (card: DiscoveryCardModel): string | null => {
  if (!isGeographyMapSource(card.source) && card.source !== 'facility') return null;

  if (card.source === 'facility') {
    const kind = card.kind as PlaceKind;
    if (kind in PLACE_KIND_LABELS) return PLACE_KIND_LABELS[kind as PlaceKind];
  }

  const wire = card.locationActivityType;
  if (wire && wire in OUTING_KIND_LABEL) return OUTING_KIND_LABEL[wire]!;

  const mapKind = card.kind;
  if (mapKind in OUTING_KIND_LABEL) return OUTING_KIND_LABEL[mapKind]!;

  return null;
};