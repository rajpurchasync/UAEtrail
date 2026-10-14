import { useMemo } from 'react';
import { describeExploreMapLoadError } from '../exploreMapErrors';
import { useExploreMap } from '../../hooks/useExploreMap';
import { useExploreMapFetchScope } from '../useExploreMapFetchScope';
import { useMemberJourneyMapPinIds } from '../../hooks/useMemberJourneyMapPinIds';
import { filterExploreMapItemsByAreaSlug, parseExploreAreaSlug } from '../exploreAreaFilter';
import { MY_TRIPS_QUERY_KEY } from '../routing';

/** Map fetch + area / my-trips scoping (R2 shell). */
export const useExploreMapCatalog = (input: {
  userId: string | undefined;
  searchParams: URLSearchParams;
}) => {
  const myTripsMode = input.searchParams.get(MY_TRIPS_QUERY_KEY) === '1';
  const areaSlug = parseExploreAreaSlug(input.searchParams);
  const mapFetch = useExploreMapFetchScope(areaSlug);
  const { data: items = [], isLoading: loading, error: mapError } = useExploreMap({
    scope: mapFetch.scope,
  });
  const { ids: myTripsPinIds, loading: myTripsPinsLoading } = useMemberJourneyMapPinIds(
    myTripsMode ? input.userId : undefined
  );

  const mapItems = useMemo(() => {
    const areaScoped = filterExploreMapItemsByAreaSlug(items, areaSlug);
    if (!myTripsMode) return areaScoped;
    if (!myTripsPinIds) return [];
    return areaScoped.filter((item) => myTripsPinIds.has(item.id));
  }, [items, myTripsMode, myTripsPinIds, areaSlug]);

  const mapLoading = (loading && items.length === 0) || (myTripsMode && myTripsPinsLoading);
  const loadError = mapError ? describeExploreMapLoadError(mapError) : null;

  return {
    myTripsMode,
    areaSlug,
    mapItems,
    mapLoading,
    loadError,
    mapFetch,
    mapQueryLoading: loading,
  };
};
