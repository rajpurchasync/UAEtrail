import { useEffect, useState } from 'react';
import type { MyActivityDTO } from '@uaetrail/shared-types';
import { api, type ActivityRequestView } from '../api/index';
import { useConsoleHubData } from '../console/useHubData';
import { pendingUpcomingRequests } from '../utils/activityDates';

type PlanNeedsYouCounts = {
  hostJoinQueue: number;
  joinerAwaitingHost: number;
  loading: boolean;
};

/** Plan schedule strip — pending host reviews + joiner requests not yet confirmed. */
export const usePlanNeedsYouCounts = (
  enabled: boolean,
  canHost: boolean,
  refreshKey = 0
): PlanNeedsYouCounts => {
  const host = useConsoleHubData();
  const [joinerAwaitingHost, setJoinerAwaitingHost] = useState(0);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setMemberLoading(true);
    Promise.all([api.getMeActivities(), api.getMeRequests()])
      .then(([activitiesRes, requestsRes]) => {
        const activities = activitiesRes.data as MyActivityDTO[];
        const requests = requestsRes.data as ActivityRequestView[];
        setJoinerAwaitingHost(pendingUpcomingRequests(activities, requests).length);
      })
      .catch(() => setJoinerAwaitingHost(0))
      .finally(() => setMemberLoading(false));
  }, [enabled, refreshKey]);

  const hostJoinQueue = canHost ? host.pendingJoinRequests : 0;
  const loading = enabled && (memberLoading || (canHost && host.loading));

  return { hostJoinQueue, joinerAwaitingHost, loading };
};
