import type { DestinationPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import type { PlaceCatalogDestinationSearchHit } from '../../places/placeCatalogDestinationIndex';
import { mergeExploreRegionPillOptionsWithDestinations } from '../../config/regions';
import {
  HOSTING_DESTINATION_SEARCH_GROUP_DESTINATION,
  HOSTING_DESTINATION_SEARCH_GROUP_PLACE,
  HOSTING_DESTINATION_SEARCH_GROUP_ROUTE,
} from '../createFlowCopy';
import { searchPlaceCatalogDestination } from '../../places/placeCatalogDestinationIndex';
import { formatExploreSearchStateWithCountry, formatExploreSearchWhereDisplay } from './exploreSearchWhereDisplay';

export type ExploreSearchWhereSuggestion =
  | { id: string; kind: 'emirate'; label: string; query: string; subtitle?: string }
  | { id: string; kind: 'catalog'; label: string; query: string; subtitle: string };

const catalogGroupLabel = (kind: 'trail' | 'place' | 'destination'): string => {
  if (kind === 'trail') return HOSTING_DESTINATION_SEARCH_GROUP_ROUTE;
  if (kind === 'place') return HOSTING_DESTINATION_SEARCH_GROUP_PLACE;
  return HOSTING_DESTINATION_SEARCH_GROUP_DESTINATION;
};

const normalize = (value: string) => value.trim().toLowerCase();

const catalogHitSubtitle = (hit: PlaceCatalogDestinationSearchHit): string => {
  if (hit.kind === 'destination') {
    return formatExploreSearchStateWithCountry(hit.subtitle);
  }
  if (hit.kind === 'place') {
    const areaName = hit.subtitle.split(' · ')[0]?.trim() ?? '';
    const stateLine = formatExploreSearchStateWithCountry(hit.state);
    return areaName ? `${areaName}, ${stateLine}` : stateLine;
  }
  const trailContext = hit.subtitle.trim();
  if (!trailContext) return formatExploreSearchWhereDisplay(hit.title);
  if (/united arab emirates/i.test(trailContext)) return trailContext;
  return `${trailContext}${trailContext.includes(',') ? '' : `, United Arab Emirates`}`;
};

export const buildExploreSearchWhereSuggestions = (
  rawQuery: string,
  places: PlaceDTO[],
  areas: DestinationPublicDTO[]
): ExploreSearchWhereSuggestion[] => {
  const q = rawQuery.trim();
  if (!q) return [];

  const out: ExploreSearchWhereSuggestion[] = [];
  const emirates = mergeExploreRegionPillOptionsWithDestinations(areas, 'AE');
  for (const row of emirates) {
    if (row.key === 'all') continue;
    const matches =
      normalize(row.label).includes(normalize(q)) || normalize(row.key).includes(normalize(q));
    if (!matches) continue;
    out.push({
      id: `emirate-${row.key}`,
      kind: 'emirate',
      label: formatExploreSearchStateWithCountry(row.label),
      query: row.label,
    });
    if (out.length >= 4) break;
  }

  const catalogHits =
    q.length >= 2 ? searchPlaceCatalogDestination(q, places, areas, 'AE', { limitPerGroup: 5 }) : [];

  for (const hit of catalogHits) {
    if (out.length >= 10) break;
    const hitId =
      hit.kind === 'trail'
        ? hit.placeId
        : hit.kind === 'destination'
          ? hit.destinationId
          : hit.placeGroupKey;
    const contextLine = catalogHitSubtitle(hit);
    out.push({
      id: `catalog-${hit.kind}-${hitId}`,
      kind: 'catalog',
      label: hit.title,
      query: hit.title,
      subtitle: `${catalogGroupLabel(hit.kind)} · ${contextLine}`,
    });
  }

  return out;
};