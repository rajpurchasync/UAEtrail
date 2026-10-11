import { useEffect, useMemo, useState } from 'react';
import type { ActivityDTO, MyActivityDTO } from '@uaetrail/shared-types';
import { api, type ActivityRequestView } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { useConsoleHubData } from '../console/useHubData';
import { useMemberAvailability } from './useMemberAvailability';
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
  const availability = useMemberAvailability(enabled);
  const host = useConsoleHubData();

  const [joined, setJoined] = useState<MyActivityDTO[]>([]);
  const [requests, setRequests] = useState<ActivityRequestView[]>([]);
  const [seekingIntents, setSeekingIntents] = useState<Awaited<ReturnType<typeof api.listMyParticipantIntents>>['data']>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  const loadMember = () => {
    if (!enabled || !user) return Promise.resolve();
    setMemberLoading(true);
    setMemberError(null);
    return Promise.all([
      api.getMeActivities(),
      api.getMeRequests(),
      api.listMyParticipantIntents(),
    ])
      .then(([activitiesRes, requestsRes, intentsRes]) => {
        setJoined(activitiesRes.data);
        setRequests(requestsRes.data);
        setSeekingIntents(intentsRes.data);
      })
      .catch(() => setMemberError('Could not load your plans.'))
      .finally(() => setMemberLoading(false));
  };

  useEffect(() => {
    void loadMember();
  }, [enabled, user?.id, refreshKey]);

  const hostedActivities = canHost ? ((host.activities ?? []) as ActivityDTO[]) : [];
  const activeSeeking = useMemo(
    () => partitionParticipantIntentsForTrips(seekingIntents).upcoming,
    [seekingIntents]
  );

  const { markers, details } = useMemo(() => {
    const built = buildPlanCalendarMaps({
      availabilitySlots: availability.data?.slots ?? [],
      joinedActivities: joined,
      joinRequests: requests,
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
    joined,
    requests,
    hostedActivities,
    activeSeeking,
    user?.id,
    filter,
  ]);

  const loading = enabled && (availability.loading || memberLoading || (canHost && host.loading));
  const error = memberError ?? availability.error ?? null;

  const reload = () => {
    void availability.reload();
    if (canHost) void host.reload();
    void loadMember();
  };

  return { loading, error, markers, details, reload };
};
