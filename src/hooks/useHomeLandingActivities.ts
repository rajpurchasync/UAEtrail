import type { ActivityDTO } from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { groupRegionTextAtBrowseFilterLevel } from '../config/groupRegionFilter';
import { buildExploreWhenSegment } from '@uaetrail/shared-types';
import { fetchApiActivities } from './publicActivitiesClientApi';
import { HOME_LANDING_FALLBACK_ACTIVITIES, type HomeLandingActivity } from '../content/homeLanding';
import { homeLandingActivitiesQueryKey } from './clientQueryKeys';

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

const fetchHomeLandingActivities = async (): Promise<HomeLandingActivitiesPayload> => {
  const listings = await fetchApiActivities('upcoming', 12);
  const upcoming = listings.slice(0, 12);
  if (upcoming.length === 0) {
    return {
      activities: HOME_LANDING_FALLBACK_ACTIVITIES,
      totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
      fromLiveApi: false,
    };
  }
  return {
    activities: upcoming.map(toLandingActivity),
    totalCount: listings.length,
    fromLiveApi: true,
  };
};

const fallbackPayload = (): HomeLandingActivitiesPayload => ({
  activities: HOME_LANDING_FALLBACK_ACTIVITIES,
  totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
  fromLiveApi: false,
});

/** Public upcoming activities for marketing landing — falls back to curated cards. */
export const useHomeLandingActivities = (): HomeLandingActivitiesState => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: homeLandingActivitiesQueryKey,
    queryFn: fetchHomeLandingActivities,
    staleTime: 60_000,
    placeholderData: fallbackPayload,
    retry: 1,
  });

  const payload = isError ? fallbackPayload() : (data ?? fallbackPayload());

  return {
    activities: payload.activities,
    totalCount: payload.totalCount,
    loading: isLoading,
    fromLiveApi: !isError && payload.fromLiveApi,
    error: isError,
    refetch: () => {
      void refetch();
    },
  };
};
