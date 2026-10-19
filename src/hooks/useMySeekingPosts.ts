import { useQuery } from '@tanstack/react-query';
import { mySeekingPostsQueryKey } from './clientQueryKeys';
import { fetchMySeekingPosts } from './planUpcomingApi';

/** Self seeking posts (`GET /me/seeking-posts`). */
export const useMySeekingPosts = (enabled = true, refreshKey = 0) => {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: mySeekingPostsQueryKey(refreshKey),
    queryFn: () => fetchMySeekingPosts(),
    enabled,
  });

  return {
    intents: data ?? [],
    loading: enabled && (isLoading || isFetching),
    error: isError ? 'Could not load your plans.' : null,
    refetch,
  };
};
