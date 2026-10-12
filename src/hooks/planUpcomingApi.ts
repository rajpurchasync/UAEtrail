import type {
  ActivityDTO,
  MyActivityRequestDTO,
  ParticipantIntentDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchJoinedUpcomingPlanData = async (): Promise<{
  activities: ActivityDTO[];
  requests: MyActivityRequestDTO[];
}> => {
  const [activitiesRes, requestsRes] = await Promise.all([
    api.getMeActivities(),
    api.getMeRequests(),
  ]);
  return {
    activities: activitiesRes.data,
    requests: requestsRes.data,
  };
};

export const fetchMyParticipantIntents = async (): Promise<ParticipantIntentDTO[]> => {
  const res = await api.listMyParticipantIntents();
  return res.data;
};
