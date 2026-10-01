import { useCallback, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { ActivityInviteShareSheet } from '../components/activity/ActivityInviteShareSheet';
import { activityShareInputFromActivity, type ActivityShareInput } from '../utils/activityShare';

export function useActivityInviteShareSheet() {
  const [activity, setActivity] = useState<ActivityShareInput | null>(null);

  const openInvite = useCallback((input: ActivityShareInput) => setActivity(input), []);

  const openInviteFromActivity = useCallback((dto: ActivityDTO) => {
    setActivity(activityShareInputFromActivity(dto));
  }, []);

  const closeInvite = useCallback(() => setActivity(null), []);

  const sheet = (
    <ActivityInviteShareSheet open={Boolean(activity)} activity={activity} onClose={closeInvite} />
  );

  return { sheet, openInvite, openInviteFromActivity, closeInvite };
}
