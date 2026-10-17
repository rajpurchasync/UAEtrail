import { useEffect, useState } from 'react';
import {
  HOST_PARTICIPANT_REVOKE_REASONS,
  type HostParticipantRevokeReason,
  formatHostParticipantRevokeNote,
  type ParticipantDTO,
} from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { AppSelect } from '../ui/AppSelect';
import { Dialog } from '../ui/Dialog';

export type ActivityParticipantRevokeDialogProps = {
  open: boolean;
  participant: ParticipantDTO | null;
  activityTitle: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (hostNote: string) => void | Promise<void>;
};

export const ActivityParticipantRevokeDialog = ({
  open,
  participant,
  activityTitle,
  submitting = false,
  onClose,
  onConfirm,
}: ActivityParticipantRevokeDialogProps) => {
  const [reason, setReason] = useState<HostParticipantRevokeReason | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setMessage('');
    setError(null);
  }, [open, participant?.id]);

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
    const hostNote = formatHostParticipantRevokeNote(reason, message.trim() || undefined);
    await onConfirm(hostNote);
  };

  const guestName = participant?.displayName ?? 'Guest';

  return (
    <Dialog open={open} onClose={handleClose} title="Revoke participant">
      {participant && (
        <>
          <p className="text-sm text-neutral-600 mb-4">
            Remove <strong>{guestName}</strong> from <strong>{activityTitle}</strong>. They&apos;ll get a
            notification with your note.
          </p>

          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>
          <AppSelect
            value={reason}
            onChange={(next) => {
              setReason(next);
              setError(null);
            }}
            options={HOST_PARTICIPANT_REVOKE_REASONS}
            disabled={submitting}
            placeholder="Select"
            aria-label="Revoke reason"
            className="mb-4"
          />

          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {needsMessage ? 'Note for the guest' : 'Anything else? (optional)'}
            {needsMessage ? <span className="text-red-500"> *</span> : null}
          </label>
          <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              placeholder={needsMessage ? 'Required for Other' : 'Add context (optional)'}
            />

          {error ? <p className="mt-2 text-sm text-red-600" role="alert">{error}</p> : null}

          <div className="mt-6 flex gap-2">
            <AppButton variant="secondary" className="flex-1" onClick={handleClose} disabled={submitting}>
              Cancel
            </AppButton>
            <AppButton
              variant="destructive"
              className="flex-1"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || submitting}
            >
              {submitting ? 'Revoking…' : 'Revoke'}
            </AppButton>
          </div>
        </>
      )}
    </Dialog>
  );
};
