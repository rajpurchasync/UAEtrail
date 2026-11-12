import type { ActivityDTO } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';

type HostActivitySuspendDialogProps = {
  activity: ActivityDTO | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  overlayClassName?: string;
};

/** Confirm soft-hide: off visitor map/search; host can resume or delete later. */
export const HostActivitySuspendDialog = ({
  activity,
  busy = false,
  onClose,
  onConfirm,
  overlayClassName,
}: HostActivitySuspendDialogProps) => (
  <Dialog
    open={Boolean(activity)}
    onClose={onClose}
    title="Suspend outing?"
    overlayClassName={overlayClassName}
  >
    <p className="mb-4 space-y-2 text-sm text-neutral-600">
      <span className="block">
        Hide &quot;{activity?.title}&quot; from the map, browse, and visitor search?
      </span>
      <span className="block font-medium text-amber-900">
        Joined people keep access. You can resume or delete it later from Hosting.
      </span>
    </p>
    <div className="flex justify-end gap-2">
      <AppButton type="button" variant="secondary" onClick={onClose}>
        Keep live
      </AppButton>
      <AppButton type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
        Suspend
      </AppButton>
    </div>
  </Dialog>
);
