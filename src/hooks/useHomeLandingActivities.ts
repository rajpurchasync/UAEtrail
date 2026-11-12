import { useEffect } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { groupRegionTextAtBrowseFilterLevel } from '../config/groupRegionFilter';
import { buildExploreWhenSegment } from '@uaetrail/shared-types';
import { fetchApiActivities } from './publicActivitiesClientApi';
import { HOME_LANDING_FALLBACK_ACTIVITIES, type HomeLandingActivity } from '../content/homeLanding';
import { homeLandingActivitiesQueryKey } from './clientQueryKeys';
import { useApiHealth } from './useApiHealth';
import {
  HOME_LANDING_ACTIVITY_FETCH_SIZE,
  HOME_LANDING_ACTIVITY_LIMIT,
  selectDiverseHomeLandingActivities,
} from '../utils/selectDiverseHomeLandingActivities';

export interface HomeLandingActivitiesState {
  activities: HomeLandingActivity[];
  totalCount: number;
  loading: boolean;
  fromLiveApi: boolean;
  error: boolean;
  refetch: () => void;
}

const resolveWhenSuffix = (activity: ActivityDTO): 'flexible' | 'fixed' | null => {
  if (activity.activityType === 'rideshare') return 'fixed';
  const requirements = activity.requirements ?? [];
  if (requirements.some((line) => /flexible time/i.test(line))) return 'flexible';
  return null;
};

const toLandingActivity = (activity: ActivityDTO): HomeLandingActivity => ({
  id: activity.id,
  title: activity.title || activity.locationName,
  description: activity.description?.trim() || null,
  region:
    groupRegionTextAtBrowseFilterLevel(activity.groupRegionLevels)?.trim() ||
    activity.region?.trim() ||
    'UAE',
  date: activity.date,
  time: activity.time,
  whenLabel:
    buildExploreWhenSegment(activity.date, activity.time, resolveWhenSuffix(activity)) ??
    activity.date,
  activityType: activity.activityType,
  price: activity.price,
  paymentTerms: activity.paymentTerms,
  pricingMode: activity.pricingMode,
  path: `/activity/${activity.id}`,
});

type HomeLandingActivitiesPayload = {
  activities: HomeLandingActivity[];
  totalCount: number;
  fromLiveApi: boolean;
};

const fallbackPayload = (): HomeLandingActivitiesPayload => ({
  activities: HOME_LANDING_FALLBACK_ACTIVITIES,
  totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
  fromLiveApi: false,
});

const fetchHomeLandingActivities = async (): Promise<HomeLandingActivitiesPayload> => {
  const listings = await fetchApiActivities('upcoming', HOME_LANDING_ACTIVITY_FETCH_SIZE);
  if (listings.length === 0) {
    return fallbackPayload();
  }
  const diverse = selectDiverseHomeLandingActivities(listings, HOME_LANDING_ACTIVITY_LIMIT);
  return {
    activities: diverse.map(toLandingActivity),
    totalCount: listings.length,
    fromLiveApi: true,
  };
};

/** Public upcoming activities for marketing landing — falls back to curated cards. */
export const useHomeLandingActivities = (): HomeLandingActivitiesState => {
  const { isSuccess: apiReady } = useApiHealth();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: homeLandingActivitiesQueryKey,
    queryFn: fetchHomeLandingActivities,
    staleTime: 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnWindowFocus: true,
    // Retry briefly while API boots; stop after a few attempts to avoid guest polling storms.
    refetchInterval: (query) => {
      if (query.state.data?.fromLiveApi) return false;
      const attempts = query.state.dataUpdateCount + query.state.errorUpdateCount;
      if (attempts >= 5) return false;
      if (query.state.status === 'error') return 8000;
      if (query.state.data && !query.state.data.fromLiveApi) return 8000;
      return false;
    },
  });

  useEffect(() => {
    if (!apiReady || data?.fromLiveApi) return;
    void refetch();
    // One catch-up when health flips ready; capped interval covers further retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional apiReady edge only
  }, [apiReady]);

  const payload = isError ? fallbackPayload() : (data ?? fallbackPayload());

  return {
    activities: payload.activities,
    totalCount: payload.totalCount,
    loading: isLoading || (isFetching && !payload.fromLiveApi),
    fromLiveApi: !isError && payload.fromLiveApi,
    error: isError && !payload.fromLiveApi,
    refetch: () => {
      void refetch();
    },
  };
};
