import { useMemo } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../context/AuthContext';
import { useConsoleHubData } from '../console/useHubData';
import { useMemberAvailability } from './useMemberAvailability';
import { useMyActivityJoinRequests } from './useMyActivityJoinRequests';
import { useMyJoinedActivities } from './useMyJoinedActivities';
import {
  buildPlanCalendarMaps,
  filterPlanCalendarByCommitment,
  type PlanCalendarDayDetail,
  type PlanCalendarDayMarkers,
} from '../plan/planCalendarMarkers';
import type { PlanCalendarScope } from '../plan/planTab';
import { planHostedActivityManagePath } from '../plan/planRouting';
import { PLAN_PATH, activityDetailPath } from '../config/routingCatalog';

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
  filter: PlanCalendarScope,
  refreshKey = 0
): PlanCalendarData => {
  const { user } = useAuth();
  const memberEnabled = enabled && Boolean(user);
  const availability = useMemberAvailability(enabled);
  const host = useConsoleHubData();

  const joinedQuery = useMyJoinedActivities(memberEnabled, refreshKey);
  const requestsQuery = useMyActivityJoinRequests(memberEnabled, refreshKey);

  const hostedActivities = useMemo(
    () => (canHost ? ((host.activities ?? []) as ActivityDTO[]) : []),
    [canHost, host.activities]
  );

  const { markers, details } = useMemo(() => {
    const built = buildPlanCalendarMaps({
      availabilitySlots: availability.data?.slots ?? [],
      joinedActivities: joinedQuery.activities,
      joinRequests: requestsQuery.requests,
      hostedActivities,
      viewerUserId: user?.id ?? null,
      activityHref: activityDetailPath,
      fixedAvailabilityManageHref: () => PLAN_PATH,
      hostingManageHref: (activityId) => planHostedActivityManagePath(activityId),
    });
    return filterPlanCalendarByCommitment(built.markers, built.details, filter);
  }, [
    availability.data?.slots,
    joinedQuery.activities,
    requestsQuery.requests,
    hostedActivities,
    user?.id,
    filter,
  ]);

  const memberLoading = joinedQuery.loading || requestsQuery.loading;
  const memberError = joinedQuery.error ?? requestsQuery.error;
  const loading = enabled && (availability.loading || memberLoading || (canHost && host.loading));
  const error = availability.error ?? memberError ?? (canHost ? host.error : null);

  const reload = () => {
    void availability.reload();
    void joinedQuery.refetch();
    void requestsQuery.refetch();
    if (canHost) void host.reload();
  };

  return { loading, error, markers, details, reload };
};