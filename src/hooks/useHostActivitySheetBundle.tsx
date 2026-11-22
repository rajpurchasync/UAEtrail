import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { activityCrewPath } from '../config/routingCatalog';
import type { ListFeedHostActivityActions } from '../list/browse/ListFeedActionsProvider';
import { launchLinkedRideshareFromParentActivity } from '../create/launchLinkedRideshareFromParentActivity';
import { useActivityInviteShareSheet } from './useActivityInviteShareSheet';

/** Invite share on the map. Host crew management is `/activity/:id/crew`. */
export const useHostActivitySheetBundle = (input: {
  tenantId: string | null | undefined;
}) => {
  const navigate = useNavigate();
  const inviteShare = useActivityInviteShareSheet();

  const openHostDesk = useCallback(
    (activity: ActivityDTO) => {
      navigate(activityCrewPath(activity.id));
    },
    [navigate]
  );

  const shareHostedActivity = useCallback(
    (activity: ActivityDTO) => {
      if (activity.status !== 'published') return;
      inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
    },
    [inviteShare]
  );

  const onCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => launchLinkedRideshareFromParentActivity(navigate, parent),
    [navigate]
  );

  const listFeedHostActions: ListFeedHostActivityActions = useMemo(
    () => ({
      onShareHostedActivity: shareHostedActivity,
      onOpenHostManage: input.tenantId ? openHostDesk : undefined,
      onInviteCrew: (activity: ActivityDTO) => {
        if (activity.status !== 'published') return;
        inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
      },
      onCreateLinkedRideshare,
    }),
    [shareHostedActivity, input.tenantId, openHostDesk, inviteShare, onCreateLinkedRideshare]
  );

  return {
    inviteShare,
    shareHostedActivity,
    openHostManage: openHostDesk,
    listFeedHostActions,
    openInviteFromActivity: inviteShare.openInviteFromActivity,
  };
};
