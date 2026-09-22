import { useEffect, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { fetchApiActivities } from '../api/public';
import { HOME_LANDING_FALLBACK_ACTIVITIES, type HomeLandingActivity } from '../content/homeLanding';

export interface HomeLandingActivitiesState {
  activities: HomeLandingActivity[];
  totalCount: number;
  loading: boolean;
  fromLiveApi: boolean;
}

const toLandingActivity = (activity: ActivityDTO): HomeLandingActivity => ({
  id: activity.id,
  title: activity.title || activity.locationName,
  region: activity.region ?? 'UAE',
  date: formatShortDate(activity.date),
  activityType: activity.activityType,
  slotsAvailable: activity.slotsAvailable,
  path: `/activity/${activity.id}`,
});

const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

/** Public upcoming activities for marketing landing — falls back to curated cards. */
export const useHomeLandingActivities = (): HomeLandingActivitiesState => {
  const [state, setState] = useState<HomeLandingActivitiesState>({
    activities: HOME_LANDING_FALLBACK_ACTIVITIES,
    totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
    loading: true,
    fromLiveApi: false,
  });

  useEffect(() => {
    let cancelled = false;

    void fetchApiActivities('upcoming')
      .then((listings) => {
        if (cancelled) return;
        const upcoming = listings.filter((item) => item.slotsAvailable > 0).slice(0, 6);
        if (upcoming.length === 0) {
          setState({
            activities: HOME_LANDING_FALLBACK_ACTIVITIES,
            totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
            loading: false,
            fromLiveApi: false,
          });
          return;
        }
        setState({
          activities: upcoming.map(toLandingActivity),
          totalCount: listings.length,
          loading: false,
          fromLiveApi: true,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          activities: HOME_LANDING_FALLBACK_ACTIVITIES,
          totalCount: HOME_LANDING_FALLBACK_ACTIVITIES.length,
          loading: false,
          fromLiveApi: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
