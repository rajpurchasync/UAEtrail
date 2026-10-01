import type { ActivityDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import type { useOrganisationActivityHostActions } from '../../hooks/useOrganisationActivityHostActions';

type HostActions = ReturnType<typeof useOrganisationActivityHostActions>;

type OrganisationActivityHostConfirmDialogsProps = {
  actions: HostActions;
  onAfterConfirm?: () => void;
  /** Above explore/manage sheets (default z-[1400]). */
  overlayClassName?: string;
};

/** Shared cancel / delete draft confirmations for host activity management. */
export const OrganisationActivityHostConfirmDialogs = ({
  actions,
  onAfterConfirm,
  overlayClassName = 'z-[1600]',
}: OrganisationActivityHostConfirmDialogsProps) => {
  const activityLabel = (activity: ActivityDTO | null) =>
    activity?.title || activity?.locationName || 'this outing';

  return (
    <>
      <Dialog
        open={Boolean(actions.confirmDelete)}
        onClose={() => actions.setConfirmDelete(null)}
        title="Delete draft?"
        overlayClassName={overlayClassName}
      >
        <p className="mb-1 text-sm text-neutral-600">
          This permanently deletes the draft. This cannot be undone.
        </p>
        <p className="mb-4 text-sm font-medium text-neutral-900">
          {activityLabel(actions.confirmDelete)}
        </p>
        <div className="flex justify-end gap-2">
          <AppButton type="button" variant="secondary" onClick={() => actions.setConfirmDelete(null)}>
            Keep draft
          </AppButton>
          <AppButton
            type="button"
            variant="destructive"
            disabled={actions.busy}
            onClick={async () => {
              await actions.confirmDeleteDraft();
              if (!actions.error) onAfterConfirm?.();
            }}
          >
            Delete
          </AppButton>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(actions.confirmCancel)}
        onClose={() => actions.setConfirmCancel(null)}
        title="Cancel activity?"
        overlayClassName={overlayClassName}
      >
        <p className="mb-1 text-sm text-neutral-600">
          Participants will be notified. This cannot be undone.
        </p>
        <p className="mb-4 text-sm font-medium text-neutral-900">
          {activityLabel(actions.confirmCancel)}
        </p>
        <div className="flex justify-end gap-2">
          <AppButton type="button" variant="secondary" onClick={() => actions.setConfirmCancel(null)}>
            Keep activity
          </AppButton>
          <AppButton
            type="button"
            variant="destructive"
            disabled={actions.busy}
            onClick={async () => {
              await actions.confirmCancelActivity();
              if (!actions.error) onAfterConfirm?.();
            }}
          >
            Cancel activity
          </AppButton>
        </div>
      </Dialog>
    </>
  );
};
