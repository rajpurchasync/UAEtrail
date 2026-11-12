import { HostActivityCancelDialog } from './HostActivityCancelDialog';
import { HostActivitySuspendDialog } from './HostActivitySuspendDialog';
import { activityCancelParticipantNotice } from '../../activity/activityCancelParticipantNotice';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';

type HostActivityManageCancelDialogsProps = {
  actions: Pick<
    HostActivityManageActions,
    | 'confirmDelete'
    | 'confirmCancel'
    | 'confirmSuspend'
    | 'busy'
    | 'setConfirmDelete'
    | 'setConfirmCancel'
    | 'setConfirmSuspend'
    | 'confirmDeleteDraft'
    | 'confirmCancelActivity'
    | 'confirmSuspendActivity'
    | 'error'
  >;
  onAfterConfirm?: () => void;
  overlayClassName?: string;
};

/** Wired to `useHostActivityManageActions` — same cancel UI as explore peek and `/activity/:id`. */
export const HostActivityManageCancelDialogs = ({
  actions,
  onAfterConfirm,
  overlayClassName = 'z-[1600]',
}: HostActivityManageCancelDialogsProps) => (
  <>
    <HostActivityCancelDialog
      activity={actions.confirmDelete}
      busy={actions.busy}
      overlayClassName={overlayClassName}
      onClose={() => actions.setConfirmDelete(null)}
      onConfirm={() => {
        void (async () => {
          await actions.confirmDeleteDraft();
          if (!actions.error) onAfterConfirm?.();
        })();
      }}
    />
    <HostActivityCancelDialog
      activity={actions.confirmCancel}
      participantNotice={
        actions.confirmCancel
          ? activityCancelParticipantNotice(actions.confirmCancel)
          : null
      }
      busy={actions.busy}
      overlayClassName={overlayClassName}
      onClose={() => actions.setConfirmCancel(null)}
      onConfirm={() => {
        void (async () => {
          await actions.confirmCancelActivity();
          if (!actions.error) onAfterConfirm?.();
        })();
      }}
    />
    <HostActivitySuspendDialog
      activity={actions.confirmSuspend}
      busy={actions.busy}
      overlayClassName={overlayClassName}
      onClose={() => actions.setConfirmSuspend(null)}
      onConfirm={() => {
        void (async () => {
          await actions.confirmSuspendActivity();
          if (!actions.error) onAfterConfirm?.();
        })();
      }}
    />
  </>
);
