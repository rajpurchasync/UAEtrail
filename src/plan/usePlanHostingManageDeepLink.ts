import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ActivityDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';

export const planHostingDeepLinkId = (searchParams: URLSearchParams): string | null =>
  searchParams.get('peek') ?? searchParams.get('roster') ?? searchParams.get('checkin');

type UsePlanHostingManageDeepLinkInput = {
  enabled: boolean;
  activities: ActivityDTO[];
  activitiesLoading: boolean;
  intents: ParticipantIntentDTO[];
};

/** Opens hosting manage / seeking intent sheets from `peek` · `roster` · `checkin` (works on list + calendar). */
export const usePlanHostingManageDeepLink = ({
  enabled,
  activities,
  activitiesLoading,
  intents,
}: UsePlanHostingManageDeepLinkInput) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageIntent, setManageIntent] = useState<ParticipantIntentDTO | null>(null);
  const openedDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const openId = planHostingDeepLinkId(searchParams);
    if (!openId || activitiesLoading) return;
    if (openedDeepLinkRef.current === openId) return;

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
  }, [activities, activitiesLoading, enabled, intents, searchParams, setSearchParams]);

  return {
    manageActivity,
    setManageActivity,
    manageIntent,
    setManageIntent,
  };
};
