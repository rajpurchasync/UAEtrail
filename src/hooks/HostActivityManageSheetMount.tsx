import { useHostActivityManageActions } from './useHostActivityManageActions';
import { ActivityManageSheet } from '../components/activity/ActivityManageSheet';
import type { ActivityDTO } from '@uaetrail/shared-types';
import type { ActivityManageInitialView } from '../components/activity/activityManageViews';

type Props = {
  tenantId: string;
  manageActivity: ActivityDTO;
  manageInitialView: ActivityManageInitialView;
  onClose: () => void;
  onMapDataChanged: () => void | Promise<void>;
  onOpenPublicPage: (activity: ActivityDTO) => void;
  onShare: (activity: ActivityDTO) => void;
};

/** Loaded on demand so explore/list first paint skips the host-manage chunk. */
export const HostActivityManageSheetMount = ({
  tenantId,
  manageActivity,
  manageInitialView,
  onClose,
  onMapDataChanged,
  onOpenPublicPage,
  onShare,
}: Props) => {
  const actions = useHostActivityManageActions(tenantId, onMapDataChanged);
  return (
    <ActivityManageSheet
      open
      activity={manageActivity}
      tenantId={tenantId}
      pendingRequests={[]}
      actions={actions}
      initialView={manageInitialView}
      onOpenPublicPage={onOpenPublicPage}
      onShare={onShare}
      onClose={onClose}
      onRequestsChanged={() => void onMapDataChanged()}
    />
  );
};
