import type { MyActivityDTO, MyActivityRequestDTO } from '@uaetrail/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
import { apiRequestConditional } from '../api/client';
import { catalogSnapshots } from '../lib/catalogSnapshot';
import type { ActivityRequestView } from '../api/types';
import { myActivityJoinRequestsQueryKey, myJoinedActivitiesQueryKey } from './clientQueryKeys';

export const fetchJoinedUpcomingPlanData = async (): Promise<{
  activities: MyActivityDTO[];
  requests: MyActivityRequestDTO[];
}> => {
  const [activitiesRes, requestsRes] = await Promise.all([
    api.getMeActivities(),
    api.getMeRequests(),
  ]);
  return {
    activities: activitiesRes.data,
    requests: requestsRes.data as unknown as MyActivityRequestDTO[],
  };
};

export const fetchMyJoinedActivities = async (): Promise<MyActivityDTO[]> => {
  const res = await api.getMeActivities();
  return res.data;
};

export const fetchMyJoinedActivitiesConditional = async (
  etag?: string | null
): Promise<{ notModified: true; etag: string | null } | { notModified: false; etag: string | null; data: MyActivityDTO[] }> => {
  const result = await apiRequestConditional<{ data: MyActivityDTO[] }>('/me/activities?pageSize=100', {
    auth: true,
    etag,
  });
  if (result.notModified) return { notModified: true, etag: result.etag };
  return { notModified: false, etag: result.etag, data: result.body.data };
};

export const invalidateMyJoinedActivitiesQueries = (queryClient: QueryClient): void => {
  catalogSnapshots.clearPrefix(myJoinedActivitiesQueryKey);
  void queryClient.invalidateQueries({ queryKey: myJoinedActivitiesQueryKey });
};

export const invalidateMyActivityJoinRequestsQueries = (queryClient: QueryClient): void => {
  void queryClient.invalidateQueries({ queryKey: myActivityJoinRequestsQueryKey });
};

export const invalidateMemberJoinPlanQueries = (queryClient: QueryClient): void => {
  invalidateMyJoinedActivitiesQueries(queryClient);
  invalidateMyActivityJoinRequestsQueries(queryClient);
};

export const fetchMyActivityJoinRequests = async (): Promise<ActivityRequestView[]> => {
  const res = await api.getMeRequests();
  return res.data;
};