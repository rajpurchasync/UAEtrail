import type {
  MyActivityDTO,
  MyActivityRequestDTO,
  ParticipantIntentDTO,
} from '@uaetrail/shared-types';
import type { QueryClient } from '@tanstack/react-query';
import { api } from '../api/index';
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

export const fetchMyParticipantIntents = async (): Promise<ParticipantIntentDTO[]> => {
  const res = await api.listMyParticipantIntents();
  return res.data;
};

export const fetchMyJoinedActivities = async (): Promise<MyActivityDTO[]> => {
  const res = await api.getMeActivities();
  return res.data;
};

export const invalidateMyJoinedActivitiesQueries = (queryClient: QueryClient): void => {
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

export const fetchMemberPlanCalendarSources = async (): Promise<{
  activities: MyActivityDTO[];
  requests: ActivityRequestView[];
  seekingIntents: ParticipantIntentDTO[];
}> => {
  const [activities, requests, seekingIntents] = await Promise.all([
    fetchMyJoinedActivities(),
    fetchMyActivityJoinRequests(),
    fetchMyParticipantIntents(),
  ]);
  return { activities, requests, seekingIntents };
};
