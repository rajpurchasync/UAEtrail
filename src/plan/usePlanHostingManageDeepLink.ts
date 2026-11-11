import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ActivityDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
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
  intents: ParticipantIntentDTO[];
};

/** Opens the edit sheet from `peek`. `roster` and `checkin` open the crew page. */
export const usePlanHostingManageDeepLink = ({
  enabled,
  activities,
  activitiesLoading,
  intents,
}: UsePlanHostingManageDeepLinkInput) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageIntent, setManageIntent] = useState<ParticipantIntentDTO | null>(null);
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
      const next = new URLSearchParams(searchParams);
      next.delete('peek');
      next.delete('checkin');
      next.delete('roster');
      setSearchParams(next, { replace: true });
      navigate(activityCrewPath(rosterId));
      return;
    }

    if (!openId || openedDeepLinkRef.current === openId) return;

    const activity = activities.find((event) => event.id === openId);
    if (activity) {
      openedDeepLinkRef.current = openId;
      setManageActivity(activity);
    } else {
      const intent = intents.find((entry) => entry.id === openId);
      if (intent) {
        openedDeepLinkRef.current = openId;
        setManageIntent(intent);
      }
    }

    const next = new URLSearchParams(searchParams);
    next.delete('peek');
    next.delete('checkin');
    next.delete('roster');
    setSearchParams(next, { replace: true });
  }, [activities, activitiesLoading, enabled, intents, navigate, searchParams, setSearchParams]);

  return {
    manageActivity,
    setManageActivity,
    manageIntent,
    setManageIntent,
  };
};
