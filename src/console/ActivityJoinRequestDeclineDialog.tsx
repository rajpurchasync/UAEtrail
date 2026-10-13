import { useEffect, useState } from 'react';
import {
  HOST_JOIN_DECLINE_REASONS,
  HostJoinDeclineReason,
  formatHostJoinDeclineNote,
} from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../api/types';
import { AppButton } from '../components/mobile/AppButton';
import { AppSelect } from '../components/ui/AppSelect';
import { Dialog } from '../components/ui/Dialog';

export interface ActivityJoinRequestDeclineDialogProps {
  open: boolean;
  request: ActivityRequestView | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (organizerNote: string) => void | Promise<void>;
}

export const ActivityJoinRequestDeclineDialog = ({
  open,
  request,
  submitting = false,
  onClose,
  onConfirm,
}: ActivityJoinRequestDeclineDialogProps) => {
  const [reason, setReason] = useState<HostJoinDeclineReason | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setMessage('');
    setError(null);
  }, [open, request?.id]);

  const needsMessage = reason === 'other';
  const canSubmit = Boolean(reason) && (!needsMessage || message.trim().length >= 3);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError('Pick a reason so they know why.');
      return;
    }
    if (needsMessage && message.trim().length < 3) {
      setError('Add a short note when you pick Other.');
      return;
    }
    setError(null);
    const organizerNote = formatHostJoinDeclineNote(reason, message.trim() || undefined);
    await onConfirm(organizerNote);
  };

  const guestName = request?.user?.displayName ?? 'Guest';
  const activityTitle =
    request?.activity?.title || request?.activity?.locationName || 'this activity';

  return (
    <Dialog open={open} onClose={handleClose} title="Decline request">
      {request && (
        <>
          <p className="text-sm text-neutral-600 mb-4">
            Let <strong>{guestName}</strong> know why they can&apos;t join{' '}
            <strong>{activityTitle}</strong>.
          </p>

          <div className="rounded-xl bg-neutral-50 p-3 mb-4">
            {request.note && (
              <p className="text-xs text-neutral-600 italic">&ldquo;{request.note}&rdquo;</p>
            )}
            {!request.note && (
              <p className="text-xs text-neutral-500">No note from the guest.</p>
            )}
          </div>

          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <AppSelect
            value={reason}
            onChange={(next) => {
              setReason(next);
              setError(null);
            }}
            options={HOST_JOIN_DECLINE_REASONS}
            disabled={submitting}
            placeholder="Select"
            aria-label="Decline reason"
            className="mb-4"
          />

          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {needsMessage ? 'Note for the guest' : 'Anything else? (optional)'}
            {needsMessage ? <span className="text-red-500"> *</span> : null}
          </label>
          <textarea
            className="w-full border rounded-xl px-3 py-2 text-sm mb-1 min-h-[88px] resize-none"
            placeholder={
              needsMessage
                ? 'Briefly explain…'
                : 'Optional details they will see with your reason…'
            }
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            disabled={submitting}
            maxLength={300}
          />
          <p className="text-[11px] text-neutral-400 mb-4">{message.length}/300</p>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
              Cancel
            </AppButton>
            <AppButton
              type="button"
              variant="destructive"
              disabled={submitting || !canSubmit}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Declining…' : 'Decline request'}
            </AppButton>
          </div>
        </>
      )}
    </Dialog>
  );
};
