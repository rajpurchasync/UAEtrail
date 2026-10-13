import { useMyActivityJoinRequests } from './useMyActivityJoinRequests';
import { useMyJoinedActivities } from './useMyJoinedActivities';

/** Joined outings + join requests for plan / activities hub surfaces (R8.2). */
export const useJoinedUpcomingPlanData = (enabled = true, refreshKey = 0) => {
  const {
    activities,
    loading: joinedLoading,
    error: joinedError,
    refetch: refetchJoined,
  } = useMyJoinedActivities(enabled, refreshKey);
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useMyActivityJoinRequests(enabled, refreshKey);

  return {
    activities,
    requests,
    loading: joinedLoading || requestsLoading,
    error: joinedError ?? requestsError,
    refetch: () => {
      void refetchJoined();
      void refetchRequests();
    },
  };
};
