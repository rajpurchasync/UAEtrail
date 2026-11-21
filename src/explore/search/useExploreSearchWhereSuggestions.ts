import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlaceCatalogRows } from '../../hooks/placeCatalogReadsClientApi';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { buildExploreSearchWhereSuggestions } from './exploreSearchWhereSuggestions';

/** Catalog + emirate rows for hub home where dropdown (does not touch page filters). */
export const useExploreSearchWhereSuggestions = (query: string, enabled: boolean) => {
  const trimmed = query.trim();
  const catalogEnabled = enabled && trimmed.length >= 2;
  const areas = useExplorePublishedAreas(catalogEnabled);

  const { data: places = [] } = useQuery({
    queryKey: ['placeCatalog', 'AE', 'hub-home-where'],
    queryFn: () => fetchPlaceCatalogRows({ countryCode: 'AE' }),
    staleTime: 5 * 60_000,
    enabled: catalogEnabled,
  });

  return useMemo(
    () => buildExploreSearchWhereSuggestions(query, catalogEnabled ? places : [], catalogEnabled ? areas : []),
    [areas, catalogEnabled, places, query]
  );
};