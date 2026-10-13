import { useCallback, useEffect, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { buildExploreWhenSegment } from '@uaetrail/shared-types';
import { fetchApiActivities } from './publicCatalogClientApi';
import { HOME_LANDING_FALLBACK_ACTIVITIES, type HomeLandingActivity } from '../content/homeLanding';

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
  region: activity.region ?? 'UAE',
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

/** Public upcoming activities for marketing landing — falls back to curated cards. */
export const useHomeLandingActivities = (): HomeLandingActivitiesState => {
  const [state, setState] = useState<Omit<HomeLandingActivitiesState, 'refetch'>>({
    activities: HOME_LANDING_FALLBACK_ACTIVITIES,
    totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
    loading: true,
    fromLiveApi: false,
    error: false
  });

  const load = useCallback(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: false }));

    void fetchApiActivities('upcoming')
      .then((listings) => {
        if (cancelled) return;
        const upcoming = listings.slice(0, 12);
        if (upcoming.length === 0) {
          setState({
            activities: HOME_LANDING_FALLBACK_ACTIVITIES,
            totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
            loading: false,
            fromLiveApi: false,
            error: false
          });
          return;
        }
        setState({
          activities: upcoming.map(toLandingActivity),
          totalCount: listings.length,
          loading: false,
          fromLiveApi: true,
          error: false
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          activities: HOME_LANDING_FALLBACK_ACTIVITIES,
          totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
          loading: false,
          fromLiveApi: false,
          error: true
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { ...state, refetch };
};
