import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { applyProductSearchMutation } from '../routing/productSearchMutation';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { activityCrewPath } from '../config/routingCatalog';

export const planHostingDeepLinkId = (searchParams: URLSearchParams): string | null =>
  searchParams.get('peek');

/** Roster deep links open `/activity/:id/crew`, not the edit sheet. */
export const planHostingRosterDeepLinkId = (searchParams: URLSearchParams): string | null =>
  searchParams.get('roster') ?? searchParams.get('checkin');

type UsePlanHostingManageDeepLinkInput = {
  enabled: boolean;
  activities: ActivityDTO[];
  activitiesLoading: boolean;
};

/** Opens the edit sheet from `peek`. `roster` and `checkin` open the crew page. */
export const usePlanHostingManageDeepLink = ({
  enabled,
  activities,
  activitiesLoading,
}: UsePlanHostingManageDeepLinkInput) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const planSearchKey = searchParams.toString();
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const openedDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const rosterId = planHostingRosterDeepLinkId(searchParams);
    const openId = planHostingDeepLinkId(searchParams);
    if (!rosterId && !openId) {
      openedDeepLinkRef.current = null;
      return;
    }
    if (activitiesLoading) return;

    if (rosterId) {
      const rosterActivity = activities.find((event) => event.id === rosterId);
      if (!rosterActivity || openedDeepLinkRef.current === rosterId) return;
      openedDeepLinkRef.current = rosterId;
      applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
        params.delete('peek');
        params.delete('checkin');
        params.delete('roster');
      });
      navigate(activityCrewPath(rosterId));
      return;
    }

    if (!openId || openedDeepLinkRef.current === openId) return;

    const activity = activities.find((event) => event.id === openId);
    if (activity) {
      openedDeepLinkRef.current = openId;
      setManageActivity(activity);
    }

    applyProductSearchMutation({ pathname, navigate, setSearchParams }, (params) => {
      params.delete('peek');
      params.delete('checkin');
      params.delete('roster');
    });
  }, [activities, activitiesLoading, enabled, navigate, pathname, planSearchKey, searchParams, setSearchParams]);

  return {
    manageActivity,
    setManageActivity,
  };
};