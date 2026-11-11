import { useNavigate } from 'react-router-dom';
import type { ActivityDTO, ParticipantIntentDTO } from '@uaetrail/shared-types';
import { activityDetailPath } from '../../config/routingCatalog';
import { ActivityManageSheet } from '../activity/ActivityManageSheet';
import { ParticipantIntentManageSheet } from '../participant-intent/ParticipantIntentManageSheet';
import { useActivityInviteShareSheet } from '../../hooks/useActivityInviteShareSheet';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';

type PlanHostingManageSheetsProps = {
  tenantId: string | null;
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

  if (!tenantId) return null;

  return (
    <>
      <ActivityManageSheet
        open={Boolean(manageActivity)}
        activity={manageActivity}
        tenantId={tenantId}
        actions={actions}
        initialView="overview"
        onOpenPublicPage={(a) => navigate(activityDetailPath(a.id))}
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
