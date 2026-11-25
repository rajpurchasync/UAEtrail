import { useQuery } from '@tanstack/react-query';
import { fetchPlaceActivities } from './placeDetailClientApi';
import { placePublishedActivitiesCountQueryKey } from './clientQueryKeys';

export type PlacePeekScheduledLoadState = 'idle' | 'loading' | 'ready';

/** Published outing count at a place — map peek scheduled row. */
export const usePlacePublishedActivitiesCount = (locationId: string | null | undefined) => {
  const placeId = locationId?.trim() || null;
  const query = useQuery({
    queryKey: placeId
      ? placePublishedActivitiesCountQueryKey(placeId)
      : ['place', 'published-activities-count', ''],
    queryFn: async (): Promise<number> => {
      const rows = await fetchPlaceActivities(placeId!);
      return rows.filter((row) => row.status === 'published').length;
    },
    enabled: Boolean(placeId),
  });

  const loadState: PlacePeekScheduledLoadState = !placeId
    ? 'idle'
    : query.isLoading
      ? 'loading'
      : 'ready';

  return { count: query.data ?? 0, loadState };
};