import { useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { buildExploreWhenSegment } from '@uaetrail/shared-types';
import { fetchApiActivities } from './publicCatalogClientApi';
import { HOME_LANDING_FALLBACK_ACTIVITIES, type HomeLandingActivity } from '../content/homeLanding';
import { useSafeAsyncEffect } from './useSafeAsyncEffect';

export interface HomeLandingActivitiesState {
  activities: HomeLandingActivity[];
  totalCount: number;
  loading: boolean;
  fromLiveApi: boolean;
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
  region: activity.region ?? 'UAE',
  whenLabel:
    buildExploreWhenSegment(activity.date, activity.time, resolveWhenSuffix(activity)) ??
    activity.date,
  activityType: activity.activityType,
  price: activity.price,
  paymentTerms: activity.paymentTerms,
  pricingMode: activity.pricingMode,
  path: `/activity/${activity.id}`,
});

const fallbackState = (): HomeLandingActivitiesState => ({
  activities: HOME_LANDING_FALLBACK_ACTIVITIES,
  totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
  loading: false,
  fromLiveApi: false,
});

/** Public upcoming activities for marketing landing — falls back to curated cards. */
export const useHomeLandingActivities = (): HomeLandingActivitiesState => {
  const [state, setState] = useState<HomeLandingActivitiesState>({
    activities: HOME_LANDING_FALLBACK_ACTIVITIES,
    totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
    loading: true,
    fromLiveApi: false,
  });

  useSafeAsyncEffect(async (isActive) => {
    try {
      const listings = await fetchApiActivities('upcoming');
      if (!isActive()) return;
      const upcoming = listings.slice(0, 6);
      if (upcoming.length === 0) {
        setState(fallbackState());
        return;
      }
      setState({
        activities: upcoming.map(toLandingActivity),
        totalCount: listings.length,
        loading: false,
        fromLiveApi: true,
      });
    } catch {
      if (isActive()) {
        setState(fallbackState());
      }
    }
  }, []);

  return state;
};
