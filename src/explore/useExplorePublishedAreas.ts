import type { AreaPublicDTO } from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { fetchPublishedAreas } from '../hooks/areaHubClientApi';
import { publishedAreasQueryKey } from '../hooks/clientQueryKeys';

export const useExplorePublishedAreasQuery = () =>
  useQuery({
    queryKey: publishedAreasQueryKey,
    queryFn: fetchPublishedAreas,
    staleTime: 5 * 60_000
  });

/** Cached published areas for explore search + area pickers (MIG-CLIENT-QUERY). */
export const useExplorePublishedAreas = (): AreaPublicDTO[] => {
  const { data } = useExplorePublishedAreasQuery();
  return data ?? [];
};
