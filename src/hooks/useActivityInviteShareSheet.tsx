import { useCallback, useMemo, useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { ActivityInviteShareSheet } from '../components/activity/ActivityInviteShareSheet';
import { ActivityOutingShareSheet } from '../components/activity/ActivityOutingShareSheet';
import {
  activityShareInputFromActivity,
  buildActivitySharePayload,
  type ActivityShareInput,
} from '../utils/activityShare';

type ShareFlowOptions = {
  canSendBuddyInvites?: boolean;
  initialSelectedBuddyIds?: string[];
};

type ShareFlowState = {
  activity: ActivityShareInput;
  canSendBuddyInvites: boolean;
  initialSelectedBuddyIds?: string[];
  phase: 'menu' | 'invite';
};

export function useActivityInviteShareSheet() {
  const [state, setState] = useState<ShareFlowState | null>(null);

  const openInvite = useCallback(
    (input: ActivityShareInput, options?: ShareFlowOptions) => {
      setState({
        activity: input,
        canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
        initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
        phase: 'invite',
      });
    },
    []
  );

  const openShareFromActivity = useCallback(
    (dto: ActivityDTO, options?: ShareFlowOptions) => {
      setState({
        activity: activityShareInputFromActivity(dto),
        canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
        initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
        phase: 'menu',
      });
    },
    []
  );

  /** Opens the in-app invite sheet directly (skip share menu). */
  const openInviteFromActivity = useCallback(
    (dto: ActivityDTO, options?: ShareFlowOptions) => {
      setState({
        activity: activityShareInputFromActivity(dto),
        canSendBuddyInvites: options?.canSendBuddyInvites ?? false,
        initialSelectedBuddyIds: options?.initialSelectedBuddyIds,
        phase: 'invite',
      });
    },
    []
  );

  const closeAll = useCallback(() => setState(null), []);

  const sharePayload = useMemo(
    () => (state ? buildActivitySharePayload(state.activity) : null),
    [state]
  );

  const openInviteFromMenu = useCallback(() => {
    setState((prev) => (prev ? { ...prev, phase: 'invite' } : prev));
  }, []);

  const sheet = (
    <>
      <ActivityOutingShareSheet
        open={Boolean(state && state.phase === 'menu')}
        sharePayload={sharePayload}
        showInviteOnApp={state?.canSendBuddyInvites ?? false}
        onInviteOnApp={state?.canSendBuddyInvites ? openInviteFromMenu : undefined}
        onClose={closeAll}
      />
      <ActivityInviteShareSheet
        open={Boolean(state && state.phase === 'invite')}
        activity={state?.activity ?? null}
        canSendBuddyInvites={state?.canSendBuddyInvites ?? false}
        initialSelectedBuddyIds={state?.initialSelectedBuddyIds}
        onClose={closeAll}
      />
    </>
  );

  return {
    sheet,
    openInvite,
    openShareFromActivity,
    openInviteFromActivity,
    closeInvite: closeAll,
  };
}
