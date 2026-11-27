import { useEffect } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { groupRegionTextAtBrowseFilterLevel } from '../config/groupRegionFilter';
import { buildExploreWhenSegment } from '@uaetrail/shared-types';
import { fetchApiActivities } from './publicActivitiesClientApi';
import { activitiesApi } from '../api/domains/activities';
import type { HomeLandingActivity } from '../content/homeLanding';
import { homeLandingActivitiesQueryKey } from './clientQueryKeys';
import { useApiHealth } from './useApiHealth';
import {
  HOME_LANDING_ACTIVITY_FETCH_SIZE,
  HOME_LANDING_ACTIVITY_LIMIT,
  selectDiverseHomeLandingActivities,
} from '../utils/selectDiverseHomeLandingActivities';
import { resolveActivityHeroImage } from '../utils/activityHeroImage';

export interface HomeLandingActivitiesState {
  activities: HomeLandingActivity[];
  totalCount: number;
  loading: boolean;
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
  coverImageUrl: resolveActivityHeroImage({
    id: activity.id,
    activityType: activity.activityType,
    images: activity.images,
    bannerUrl: activity.bannerUrl,
    location: (activity as ActivityDTO & { location?: { images?: string[] } }).location,
  }),
});

const emptyPayload = () => ({
  activities: [] as HomeLandingActivity[],
  totalCount: 0,
});

const fetchHomeLandingActivities = async () => {
  let listings: ActivityDTO[];
  try {
    const featured = await activitiesApi.getFeaturedActivities(HOME_LANDING_ACTIVITY_FETCH_SIZE);
    listings = featured.data ?? [];
  } catch {
    listings = [];
  }
  if (listings.length === 0) {
    listings = await fetchApiActivities('upcoming', HOME_LANDING_ACTIVITY_FETCH_SIZE);
  }
  if (listings.length === 0) {
    return emptyPayload();
  }
  const diverse = selectDiverseHomeLandingActivities(listings, HOME_LANDING_ACTIVITY_LIMIT);
  return {
    activities: diverse.map(toLandingActivity),
    totalCount: listings.length,
  };
};

/** Public upcoming activities for marketing landing — API-only; empty state when none published. */
export const useHomeLandingActivities = (): HomeLandingActivitiesState => {
  const { isSuccess: apiReady } = useApiHealth();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: homeLandingActivitiesQueryKey,
    queryFn: fetchHomeLandingActivities,
    staleTime: 60_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      if (query.state.status === 'success') return false;
      const attempts = query.state.dataUpdateCount + query.state.errorUpdateCount;
      if (attempts >= 5) return false;
      if (query.state.status === 'error') return 8000;
      return false;
    },
  });

  useEffect(() => {
    if (!apiReady || data) return;
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catch-up when API health flips ready
  }, [apiReady]);

  const payload = isError ? emptyPayload() : (data ?? emptyPayload());

  return {
    activities: payload.activities,
    totalCount: payload.totalCount,
    loading: isLoading || (isFetching && payload.activities.length === 0 && !isError),
    error: isError,
    refetch: () => {
      void refetch();
    },
  };
};