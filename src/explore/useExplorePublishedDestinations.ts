import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { fetchPublishedDestinations } from '../hooks/destinationHubClientApi';
import { publishedAreasQueryKey } from '../hooks/clientQueryKeys';

export const useExplorePublishedDestinationsQuery = (enabled = true) =>
  useQuery({
    queryKey: publishedAreasQueryKey,
    queryFn: fetchPublishedDestinations,
    staleTime: 5 * 60_000,
    enabled,
  });

/** Cached published areas for explore search + area pickers (MIG-CLIENT-QUERY). */
export const useExplorePublishedDestinations = (enabled = true): AreaPublicDTO[] => {
  const { data } = useExplorePublishedDestinationsQuery(enabled);
  return data ?? [];
};
