import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../api/types';
import { activityDetailPath } from '../../config/routingCatalog';
import { ActivityManageSheet } from '../activity/ActivityManageSheet';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';

type PlanHostingManageSheetsProps = {
  tenantId: string | null;
  actions: HostActivityManageActions;
  pendingRequests: ActivityRequestView[];
  onHostReload: () => void;
  manageActivity: ActivityDTO | null;
  onManageActivityClose: () => void;
};

export const PlanHostingManageSheets = ({
  tenantId,
  actions,
  pendingRequests,
  onHostReload,
  manageActivity,
  onManageActivityClose,
}: PlanHostingManageSheetsProps) => {
  const navigate = useNavigate();
  const inviteShare = useActivityInviteShareSheet();

  if (!tenantId) return null;

  return (
    <ActivityManageSheet
      open={Boolean(manageActivity)}
      activity={manageActivity}
      tenantId={tenantId}
      actions={actions}
      pendingRequests={pendingRequests}
      initialView="overview"
      onOpenPublicPage={(a) => navigate(activityDetailPath(a.id))}
      onShare={(a) => inviteShare.openShareFromActivity(a, { canSendFriendInvites: true })}
      onClose={onManageActivityClose}
      onRequestsChanged={onHostReload}
    />
  );
};