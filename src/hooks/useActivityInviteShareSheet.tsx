import { useCallback, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { ActivityInviteShareSheet } from '../components/activity/ActivityInviteShareSheet';
import { activityShareInputFromActivity, type ActivityShareInput } from '../utils/activityShare';

type InviteSheetState = {
  activity: ActivityShareInput;
  canSendBuddyInvites: boolean;
  initialSelectedBuddyIds?: string[];
} | null;

export function useActivityInviteShareSheet() {
  const [state, setState] = useState<InviteSheetState>(null);

  const openInvite = useCallback(
    (
      input: ActivityShareInput,
      options?: { canSendBuddyInvites?: boolean; initialSelectedBuddyIds?: string[] }
    ) => {
      setState({
        activity: input,
        canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
        initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
      });
    },
    []
  );

  const openInviteFromActivity = useCallback(
    (
      dto: ActivityDTO,
      options?: { canSendBuddyInvites?: boolean; initialSelectedBuddyIds?: string[] }
    ) => {
      setState({
        activity: activityShareInputFromActivity(dto),
        canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
        initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
      });
    },
    []
  );

  const closeInvite = useCallback(() => setState(null), []);

  const sheet = (
    <ActivityInviteShareSheet
      open={Boolean(state)}
      activity={state?.activity ?? null}
      canSendBuddyInvites={state?.canSendBuddyInvites ?? false}
      initialSelectedBuddyIds={state?.initialSelectedBuddyIds}
      onClose={closeInvite}
    />
  );

  return { sheet, openInvite, openInviteFromActivity, closeInvite };
}
