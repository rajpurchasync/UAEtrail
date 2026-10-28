import { useNavigate } from 'react-router-dom';
import type { ActivityDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../api/types';
import { ActivityManageSheet } from '../activity/ActivityManageSheet';
import { ParticipantIntentManageSheet } from '../participant-intent/ParticipantIntentManageSheet';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';

type PlanHostingManageSheetsProps = {
  tenantId: string | null;
  pendingRequests: ActivityRequestView[];
  actions: HostActivityManageActions;
  onHostReload: () => void;
  onIntentsChanged: () => void;
  manageActivity: ActivityDTO | null;
  onManageActivityClose: () => void;
  manageIntent: ParticipantIntentDTO | null;
  onManageIntentClose: () => void;
};

export const PlanHostingManageSheets = ({
  tenantId,
  pendingRequests,
  actions,
  onHostReload,
  onIntentsChanged,
  manageActivity,
  onManageActivityClose,
  manageIntent,
  onManageIntentClose,
}: PlanHostingManageSheetsProps) => {
  const navigate = useNavigate();
  const inviteShare = useActivityInviteShareSheet();

  if (!tenantId) return inviteShare.sheet;

  return (
    <>
      {inviteShare.sheet}
      <ActivityManageSheet
        open={Boolean(manageActivity)}
        activity={manageActivity}
        tenantId={tenantId}
        pendingRequests={pendingRequests}
        actions={actions}
        initialView="overview"
        onOpenPublicPage={(a) => navigate(`/activity/${a.id}`)}
        onShare={(a) =>
          inviteShare.openShareFromActivity(a, { canSendBuddyInvites: true })
        }
        onClose={onManageActivityClose}
        onRequestsChanged={onHostReload}
      />
      <ParticipantIntentManageSheet
        open={Boolean(manageIntent)}
        intent={manageIntent}
        onClose={onManageIntentClose}
        onChanged={onIntentsChanged}
      />
    </>
  );
};
