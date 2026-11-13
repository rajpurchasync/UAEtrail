import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';
import { EXPLORE_Z } from '../../config/exploreTheme';
import {
  ACTIVITY_ROLLCALL_BACK_LABEL,
  ACTIVITY_ROLLCALL_TITLE,
} from '../../content/activityRollcallCopy';
import type { ActivityRequestView } from '../../hooks/publishingJoinQueueClientApi';
import { MobileBackButton } from '../mobile/MobileBackButton';
import { ActivityRollcallView, type ActivityRollcallViewProps } from './ActivityRollcallView';

export type ActivityRollcallSheetProps = {
  open: boolean;
  onClose: () => void;
  backLabel?: string;
} & Omit<ActivityRollcallViewProps, 'className'> & {
    pendingRequests?: ActivityRequestView[];
  };

export const ActivityRollcallSheet = ({
  open,
  onClose,
  backLabel = ACTIVITY_ROLLCALL_BACK_LABEL,
  tenantId,
  activityId,
  pendingRequests,
  busyRequestId,
  onParticipantsError,
  onApproveJoinRequest,
  onRejectJoinRequest,
}: ActivityRollcallSheetProps) => (
  <ExploreResponsiveSheet
    open={open}
    onClose={onClose}
    title={ACTIVITY_ROLLCALL_TITLE}
    layout="fullscreen"
    zClass={EXPLORE_Z.activityDetailInviteSheet}
    overlayFixed
    showCloseButton={false}
    showHandle={false}
  >
    <div className="flex h-full min-h-0 flex-col bg-neutral-50">
      <header className="shrink-0 border-b border-neutral-200/80 bg-white pt-safe-plus-2">
        <div className="grid grid-cols-[minmax(72px,auto)_1fr_auto] items-center gap-2 px-3 pb-2">
          <MobileBackButton onPress={onClose} label={backLabel} className="min-h-[36px] py-0 -ml-1" />
          <h2 className="min-w-0 truncate text-center text-[15px] font-semibold leading-tight text-neutral-900">
            {ACTIVITY_ROLLCALL_TITLE}
          </h2>
          <div className="w-[72px]" aria-hidden />
        </div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-3">
        <ActivityRollcallView
          tenantId={tenantId}
          activityId={activityId}
          pendingRequests={pendingRequests}
          busyRequestId={busyRequestId}
          onParticipantsError={onParticipantsError}
          onApproveJoinRequest={onApproveJoinRequest}
          onRejectJoinRequest={onRejectJoinRequest}
          className="min-h-0"
        />
      </div>
    </div>
  </ExploreResponsiveSheet>
);
