import type { ActivityDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';

type HostActivityCancelDialogProps = {
  activity: ActivityDTO | null;
  participantNotice?: string | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  overlayClassName?: string;
};

/** Confirm cancel published outing or delete draft — map peek, detail, and publishing workspace. */
export const HostActivityCancelDialog = ({
  activity,
  participantNotice = null,
  busy = false,
  onClose,
  onConfirm,
  overlayClassName,
}: HostActivityCancelDialogProps) => {
  const isDraft = activity?.status === 'draft';
  const isSuspended = activity?.status === 'suspended';
  const title = isDraft ? 'Delete draft?' : isSuspended ? 'Delete outing?' : 'Cancel activity?';
  const body = isDraft
    ? `Remove "${activity?.title}" permanently?`
    : isSuspended
      ? `Permanently remove "${activity?.title}"? It stays off the map either way — this cannot be resumed.`
      : `Cancel "${activity?.title}"?`;
  const confirmLabel = isDraft || isSuspended ? 'Delete' : 'Cancel activity';

  return (
    <Dialog
      open={Boolean(activity)}
      onClose={onClose}
      title={title}
      overlayClassName={overlayClassName}
    >
      <p className="mb-4 space-y-2 text-sm text-neutral-600">
        <span className="block">{body}</span>
        {participantNotice ? (
          <span className="block font-medium text-amber-900">{participantNotice}</span>
        ) : null}
      </p>
      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="secondary" onClick={onClose}>
          Keep
        </AppButton>
        <AppButton
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </AppButton>
      </div>
    </Dialog>
  );
};
