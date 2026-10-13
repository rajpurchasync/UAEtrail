import { useMemo } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { useConsoleHubData } from '../console/useHubData';
import { useMemberAvailability } from './useMemberAvailability';
import { useMyActivityJoinRequests } from './useMyActivityJoinRequests';
import { useMyJoinedActivities } from './useMyJoinedActivities';
import { useMyParticipantIntents } from './useMyParticipantIntents';
import {
  buildPlanCalendarMaps,
  filterPlanCalendarByCommitment,
  type PlanCalendarDayDetail,
  type PlanCalendarDayMarkers,
} from '../plan/planCalendarMarkers';
import type { PlanCommitmentFilter } from '../plan/planTab';
import { tripsHostedActivityPath, tripsSelfDemandPath } from '../member-plan/tripsRouting';
import { activityDetailPath } from '../config/routingCatalog';
import { partitionParticipantIntentsForTrips } from '../member-plan/participantIntentTrips';

type PlanCalendarData = {
  loading: boolean;
  error: string | null;
  markers: Map<string, PlanCalendarDayMarkers>;
  details: Map<string, PlanCalendarDayDetail[]>;
  reload: () => void;
};

export const usePlanCalendarData = (
  enabled: boolean,
  canHost: boolean,
  filter: PlanCommitmentFilter,
  refreshKey = 0
): PlanCalendarData => {
  const { user } = useAuth();
  const memberEnabled = enabled && Boolean(user);
  const availability = useMemberAvailability(enabled);
  const host = useConsoleHubData();

  const joinedQuery = useMyJoinedActivities(memberEnabled, refreshKey);
  const requestsQuery = useMyActivityJoinRequests(memberEnabled, refreshKey);
  const intentsQuery = useMyParticipantIntents(memberEnabled, refreshKey);

  const hostedActivities = canHost ? ((host.activities ?? []) as ActivityDTO[]) : [];
  const activeSeeking = useMemo(
    () => partitionParticipantIntentsForTrips(intentsQuery.intents).upcoming,
    [intentsQuery.intents]
  );

  const { markers, details } = useMemo(() => {
    const built = buildPlanCalendarMaps({
      availabilitySlots: availability.data?.slots ?? [],
      joinedActivities: joinedQuery.activities,
      joinRequests: requestsQuery.requests,
      hostedActivities,
      seekingIntents: activeSeeking,
      viewerUserId: user?.id ?? null,
      activityHref: activityDetailPath,
      seekingIntentHref: tripsSelfDemandPath,
      hostingManageHref: (activityId) => tripsHostedActivityPath(activityId),
    });
    return filterPlanCalendarByCommitment(built.markers, built.details, filter);
  }, [
    availability.data?.slots,
    joinedQuery.activities,
    requestsQuery.requests,
    hostedActivities,
    activeSeeking,
    user?.id,
    filter,
  ]);

  const memberLoading = joinedQuery.loading || requestsQuery.loading || intentsQuery.loading;
  const memberError = joinedQuery.error ?? requestsQuery.error ?? intentsQuery.error;
  const loading = enabled && (availability.loading || memberLoading || (canHost && host.loading));
  const error = memberError ?? availability.error ?? null;

  const reload = () => {
    void availability.reload();
    if (canHost) void host.reload();
    void joinedQuery.refetch();
    void requestsQuery.refetch();
    void intentsQuery.refetch();
  };

  return { loading, error, markers, details, reload };
};
