import { useEffect, useMemo, useState } from 'react';
import type { ActivityDTO, ExploreMapItemDTO, MyActivityDTO } from '@uaetrail/shared-types';
import { api, type ActivityRequestView } from '../api/index';
import { activityDetailPath } from '../config/routingCatalog';
import { useAuth } from '../context/AuthContext';
import { useConsoleHubData } from '../console/useHubData';
import { useExploreMap } from './useExploreMap';
import { useMemberAvailability } from './useMemberAvailability';
import {
  buildPlanCalendarMaps,
  type PlanCalendarDayDetail,
  type PlanCalendarDayMarkers,
} from '../plan/planCalendarMarkers';

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
  refreshKey = 0
): PlanCalendarData => {
  const { user } = useAuth();
  const availability = useMemberAvailability(enabled);
  const explore = useExploreMap({ enabled });
  const host = useConsoleHubData();

  const [joined, setJoined] = useState<MyActivityDTO[]>([]);
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;
    setMemberLoading(true);
    setMemberError(null);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([activitiesRes, requestsRes]) => {
        setJoined(activitiesRes.data);
        setRequests(requestsRes.data);
      })
      .catch(() => setMemberError('Could not load your plans.'))
      .finally(() => setMemberLoading(false));
  }, [enabled, user?.id, refreshKey]);

  const activityHref = (activityId: string) => activityDetailPath(activityId);
  const exploreItemHref = (item: ExploreMapItemDTO) => item.path;

  const hostedActivities = canHost ? ((host.activities ?? []) as ActivityDTO[]) : [];

  const { markers, details } = useMemo(
    () =>
      buildPlanCalendarMaps({
        availabilitySlots: availability.data?.slots ?? [],
        joinedActivities: joined,
        joinRequests: requests,
        hostedActivities,
        exploreItems: explore.data ?? [],
        viewerUserId: user?.id ?? null,
        activityHref,
        exploreItemHref,
      }),
    [availability.data?.slots, joined, requests, hostedActivities, explore.data, user?.id]
  );

  const loading =
    enabled && (availability.loading || memberLoading || explore.isLoading || (canHost && host.loading));
  const error =
    memberError ?? availability.error ?? (explore.error ? 'Could not load map outings.' : null);

  const reload = () => {
    void availability.reload();
    void explore.refetch();
    if (canHost) void host.reload();
    if (!enabled || !user) return;
    setMemberLoading(true);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([activitiesRes, requestsRes]) => {
        setJoined(activitiesRes.data);
        setRequests(requestsRes.data);
      })
      .finally(() => setMemberLoading(false));
  };

  return { loading, error, markers, details, reload };
};
