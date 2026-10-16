import { useMemo } from 'react';
import { describeExploreMapLoadError } from '../exploreMapErrors';
import { useExploreMap } from '../../hooks/useExploreMap';
import { useExploreMapFetchScope } from '../useExploreMapFetchScope';
import { useMemberJourneyMapPinIds } from '../../hooks/useMemberJourneyMapPinIds';
import { filterExploreMapItemsByAreaSlug, parseExploreAreaSlug } from '../exploreAreaFilter';
import { parseExploreMyPlanMapMode } from '../routing';

/** Map fetch + area / my-plan map scoping (R2 shell). */
export const useExploreMapCatalog = (input: {
  userId: string | undefined;
  searchParams: URLSearchParams;
}) => {
  const myPlanMapMode = parseExploreMyPlanMapMode(input.searchParams);
  const areaSlug = parseExploreAreaSlug(input.searchParams);
  const mapFetch = useExploreMapFetchScope(areaSlug);
  const { data: items = [], isLoading: loading, error: mapError } = useExploreMap({
    scope: mapFetch.scope,
  });
  const { ids: myPlanPinIds, loading: myPlanPinsLoading } = useMemberJourneyMapPinIds(
    myPlanMapMode ? input.userId : undefined
  );

  const mapItems = useMemo(() => {
    const areaScoped = filterExploreMapItemsByAreaSlug(items, areaSlug);
    if (!myPlanMapMode) return areaScoped;
    if (!myPlanPinIds) return [];
    return areaScoped.filter((item) => myPlanPinIds.has(item.id));
  }, [items, myPlanMapMode, myPlanPinIds, areaSlug]);

  const mapLoading = (loading && items.length === 0) || (myPlanMapMode && myPlanPinsLoading);
  const loadError = mapError ? describeExploreMapLoadError(mapError) : null;

  return {
    myPlanMapMode,
    areaSlug,
    mapItems,
    mapLoading,
    loadError,
    mapFetch,
    mapQueryLoading: loading,
  };
};
