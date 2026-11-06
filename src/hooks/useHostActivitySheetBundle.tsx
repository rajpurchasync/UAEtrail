import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../config/routingCatalog';
import type { ListFeedHostActivityActions } from '../list/ui/ListFeedActionsProvider';
import { navigateToCreateLinkedRideshare } from '../explore/navigateCreateLinkedRideshare';
import { useActivityInviteShareSheet } from './useActivityInviteShareSheet';
import { useDeferredHostManageSheet } from './DeferredHostActivityManageSheet';

/** Invite share + host manage sheet — explore map peek, list feed, and browse. */
export const useHostActivitySheetBundle = (input: {
  tenantId: string | null | undefined;
  onMapDataChanged: () => void | Promise<void>;
}) => {
  const navigate = useNavigate();
  const inviteShare = useActivityInviteShareSheet();

  const onOpenPublicPage = useCallback(
    (activity: ActivityDTO) => navigate(activityDetailPath(activity.id)),
    [navigate]
  );

  const onShare = useCallback(
    (activity: ActivityDTO) => {
      if (activity.status !== 'published') return;
      inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
    },
    [inviteShare]
  );

  const deferredManage = useDeferredHostManageSheet({
    tenantId: input.tenantId,
    onMapDataChanged: input.onMapDataChanged,
    onOpenPublicPage,
    onShare,
  });

  const shareHostedActivity = useCallback(
    (activity: ActivityDTO) => {
      if (activity.status !== 'published') return;
      inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
    },
    [inviteShare]
  );

  const onCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => navigateToCreateLinkedRideshare(navigate, parent),
    [navigate]
  );

  const listFeedHostActions: ListFeedHostActivityActions = useMemo(
    () => ({
      onShareHostedActivity: shareHostedActivity,
      onOpenHostManage: input.tenantId ? deferredManage.openHostManage : undefined,
      onInviteCrew: (activity: ActivityDTO) => {
        if (activity.status !== 'published') return;
        inviteShare.openShareFromActivity(activity, { canSendBuddyInvites: true });
      },
      onCreateLinkedRideshare,
    }),
    [shareHostedActivity, input.tenantId, deferredManage.openHostManage, inviteShare, onCreateLinkedRideshare]
  );

  return {
    inviteShare,
    shareHostedActivity,
    openHostManage: deferredManage.openHostManage,
    listFeedHostActions,
    hostManageSheet: deferredManage.hostManageSheet,
    openInviteFromActivity: inviteShare.openInviteFromActivity,
  };
};
