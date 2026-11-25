import { useMemo } from 'react';
import { describeExploreMapLoadError } from '../exploreMapErrors';
import { useExploreMap } from '../../hooks/useExploreMap';
import { useExploreMapFetchScope } from '../useExploreMapFetchScope';
import { exploreMapCatalogQuery } from '../exploreMapCatalogQuery';
import { parseExplorePinKindFilter } from '../explorePinKindFilter';
import { parseMapFilter, parseVenueListFilter } from '../routing';
import {
  EXPLORE_PLACE_TYPES_PARAM,
  EXPLORE_TRIP_TYPES_PARAM,
  parsePlaceMapTopicsParam,
  parseTripMapTopicsParam,
} from '../exploreMapQuickTopicFilters';
import { useMemberJourneyMapPinIds } from '../../hooks/useMemberJourneyMapPinIds';
import { filterExploreMapItemsByDestinationSlug, parseExploreDestinationSlug } from '../exploreDestinationFilter';
import { parseExploreMyPlanMapMode } from '../routing';

/** Map fetch + area / my-plan map scoping (R2 shell). */
export const useExploreMapCatalog = (input: {
  userId: string | undefined;
  searchParams: URLSearchParams;
}) => {
  const myPlanMapMode = parseExploreMyPlanMapMode(input.searchParams);
  const destinationSlug = parseExploreDestinationSlug(input.searchParams);
  const mapFetch = useExploreMapFetchScope(destinationSlug);
  const catalogQuery = exploreMapCatalogQuery({
    pinKind: parseExplorePinKindFilter(input.searchParams.get('pinKind')),
    mapFilter: parseMapFilter(input.searchParams.get('filter')),
    tripTopics: parseTripMapTopicsParam(input.searchParams.get(EXPLORE_TRIP_TYPES_PARAM)),
    placeTopics: parsePlaceMapTopicsParam(input.searchParams.get(EXPLORE_PLACE_TYPES_PARAM)),
    venueFilter: parseVenueListFilter(
      input.searchParams.get('places'),
      input.searchParams.get('filter'),
      input.searchParams.get('activity')
    ),
  });
  const { data: items = [], isLoading: loading, error: mapError } = useExploreMap({
    scope: mapFetch.scope,
    sources: catalogQuery.sources,
    includeRideshare: catalogQuery.includeRideshare,
  });
  const { ids: myPlanPinIds, loading: myPlanPinsLoading } = useMemberJourneyMapPinIds(
    myPlanMapMode ? input.userId : undefined
  );

  const mapItems = useMemo(() => {
    const areaScoped = filterExploreMapItemsByDestinationSlug(items, destinationSlug);
    if (!myPlanMapMode) return areaScoped;
    if (!myPlanPinIds) return [];
    return areaScoped.filter((item) => myPlanPinIds.has(item.id));
  }, [items, myPlanMapMode, myPlanPinIds, destinationSlug]);

  const mapLoading = (loading && items.length === 0) || (myPlanMapMode && myPlanPinsLoading);
  const loadError = mapError ? describeExploreMapLoadError(mapError) : null;

  return {
    myPlanMapMode,
    destinationSlug,
    mapItems,
    mapLoading,
    loadError,
    mapFetch,
    mapQueryLoading: loading,
  };
};
