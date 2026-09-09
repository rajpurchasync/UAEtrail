import { useEffect, useState } from 'react';
import { WITHDRAW_REASONS, WithdrawReason } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { AppSelect } from './AppSelect';
import { Dialog } from './Dialog';

export interface WithdrawRequestModalProps {
  open: boolean;
  onClose: () => void;
  tripTitle: string;
  tripDate?: string;
  /** pending vs confirmed wording */
  variant?: 'request' | 'trip';
  submitting?: boolean;
  onConfirm: (payload: { reason: WithdrawReason; message?: string }) => void | Promise<void>;
}

export const WithdrawRequestModal = ({
  open,
  onClose,
  tripTitle,
  tripDate,
  variant = 'request',
  submitting = false,
  onConfirm
}: WithdrawRequestModalProps) => {
  const [reason, setReason] = useState<WithdrawReason | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setMessage('');
    setError(null);
  }, [open, tripTitle]);

  const title = variant === 'trip' ? 'Leaving this trip?' : 'Cancel your request?';
  const confirmLabel = variant === 'trip' ? 'Yes, withdraw' : 'Yes, cancel';
  const needsMessage = reason === 'other';
  const canSubmit = Boolean(reason) && (!needsMessage || message.trim().length >= 3);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Pick a reason so the host knows what happened.');
      return;
    }
    if (needsMessage && message.trim().length < 3) {
      setError('Tell us a little more when you pick Other.');
      return;
    }
    setError(null);
    await onConfirm({
      reason,
      message: message.trim() || undefined
    });
  };

  const handleClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title={title}>
      <p className="text-sm text-neutral-600 mb-4">
        {variant === 'trip' ? 'You are withdrawing from' : 'You are cancelling your request for'}{' '}
        <strong>{tripTitle}</strong>
        {tripDate ? <> on {tripDate}</> : null}.
      </p>

      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        Why are you leaving? <span className="text-red-500">*</span>
      </label>
      <AppSelect
        value={reason}
        onChange={(next) => {
          setReason(next);
          setError(null);
        }}
        options={WITHDRAW_REASONS}
        disabled={submitting}
        placeholder="Select"
        aria-label="Withdraw reason"
        className="mb-4"
      />

      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {needsMessage ? 'Tell us more' : 'Anything else for the host? (optional)'}
      </label>
      <textarea
        className="ios-input text-[15px] min-h-[88px] resize-none mb-2"
        placeholder={
          needsMessage
            ? 'Briefly explain why you are withdrawing…'
            : 'Add any details for the host (optional)…'
        }
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setError(null);
        }}
        disabled={submitting}
        maxLength={500}
      />
      <p className="text-[11px] text-neutral-400 mb-4">{message.length}/500</p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex gap-3">
        <AppButton variant="secondary" fullWidth onClick={handleClose} disabled={submitting}>
          Keep spot
        </AppButton>
        <AppButton variant="destructive" fullWidth onClick={handleSubmit} disabled={submitting || !canSubmit}>
          {submitting ? 'Submitting…' : confirmLabel}
        </AppButton>
      </div>
    </Dialog>
  );
};
