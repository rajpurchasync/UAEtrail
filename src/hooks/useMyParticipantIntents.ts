import { useQuery } from '@tanstack/react-query';
import { myParticipantIntentsQueryKey } from './clientQueryKeys';
import { fetchMyParticipantIntents } from './planUpcomingApi';

/** Self demand / seeking intents (`GET /me/participant-intents`). */
export const useMyParticipantIntents = (enabled = true, refreshKey = 0) => {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: myParticipantIntentsQueryKey(refreshKey),
    queryFn: () => fetchMyParticipantIntents(),
    enabled,
  });

  return {
    intents: data ?? [],
    loading: enabled && (isLoading || isFetching),
    error: isError ? 'Could not load your plans.' : null,
    refetch,
  };
};
