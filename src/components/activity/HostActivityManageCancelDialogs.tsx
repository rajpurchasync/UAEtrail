import { HostActivityCancelDialog } from './HostActivityCancelDialog';
import { activityCancelParticipantNotice } from '../../activity/activityCancelParticipantNotice';
import type { HostActivityManageActions } from '../../hooks/useHostActivityManageActions';

type HostActivityManageCancelDialogsProps = {
  actions: Pick<
    HostActivityManageActions,
    | 'confirmDelete'
    | 'confirmCancel'
    | 'busy'
    | 'setConfirmDelete'
    | 'setConfirmCancel'
    | 'confirmDeleteDraft'
    | 'confirmCancelActivity'
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
  </>
);
