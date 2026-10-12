import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../config/routingCatalog';
import { ActivityManageSheet } from '../components/host/ActivityManageSheet';
import type { HostActivityManageInitialView } from '../components/host/hostActivityManageViews';
import type { ListFeedHostActivityActions } from '../list/ui/ListFeedActionsProvider';
import { navigateToCreateLinkedRideshare } from '../explore/navigateCreateLinkedRideshare';
import { useActivityInviteShareSheet } from './useActivityInviteShareSheet';
import { useHostActivityManageActions } from './useHostActivityManageActions';

/** Invite share + host manage sheet — explore map peek, list feed, and browse. */
export const useHostActivitySheetBundle = (input: {
  tenantId: string | null | undefined;
  onMapDataChanged: () => void | Promise<void>;
}) => {
  const navigate = useNavigate();
  const inviteShare = useActivityInviteShareSheet();
  const [manageActivity, setManageActivity] = useState<ActivityDTO | null>(null);
  const [manageInitialView, setManageInitialView] =
    useState<HostActivityManageInitialView>('overview');
  const hostManageActions = useHostActivityManageActions(input.tenantId ?? null, input.onMapDataChanged);

  const openHostManage = useCallback(
    (activity: ActivityDTO, initialView: HostActivityManageInitialView = 'participants') => {
      setManageActivity(activity);
      setManageInitialView(initialView);
    },
    []
  );

  const shareHostedActivity = useCallback(
    (activity: ActivityDTO) => {
      if (activity.status !== 'published') return;
      inviteShare.openInviteFromActivity(activity, { canSendBuddyInvites: true });
    },
    [inviteShare.openInviteFromActivity]
  );

  const onCreateLinkedRideshare = useCallback(
    (parent: ActivityDTO) => navigateToCreateLinkedRideshare(navigate, parent),
    [navigate]
  );

  const listFeedHostActions: ListFeedHostActivityActions = useMemo(
    () => ({
      onShareHostedActivity: shareHostedActivity,
      onOpenHostManage: input.tenantId ? openHostManage : undefined,
      onInviteCrew: (activity: ActivityDTO) => {
        if (activity.status !== 'published') return;
        inviteShare.openInviteFromActivity(activity, { canSendBuddyInvites: true });
      },
      onCreateLinkedRideshare,
    }),
    [
      shareHostedActivity,
      input.tenantId,
      openHostManage,
      inviteShare.openInviteFromActivity,
      onCreateLinkedRideshare,
    ]
  );

  const closeManage = useCallback(() => {
    setManageActivity(null);
    setManageInitialView('overview');
  }, []);

  const hostManageSheet =
    input.tenantId ? (
      <ActivityManageSheet
        open={Boolean(manageActivity)}
        activity={manageActivity}
        tenantId={input.tenantId}
        pendingRequests={[]}
        actions={hostManageActions}
        initialView={manageInitialView}
        onOpenPublicPage={(a) => navigate(activityDetailPath(a.id))}
        onShare={(a) => inviteShare.openInviteFromActivity(a, { canSendBuddyInvites: true })}
        onClose={closeManage}
        onRequestsChanged={() => void input.onMapDataChanged()}
      />
    ) : null;

  return {
    inviteShare,
    shareHostedActivity,
    openHostManage,
    listFeedHostActions,
    hostManageSheet,
    openInviteFromActivity: inviteShare.openInviteFromActivity,
  };
};
