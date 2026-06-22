import { useState } from 'react';
import { WITHDRAW_REASONS, WithdrawReason } from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
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
  const [reason, setReason] = useState<WithdrawReason>('schedule_conflict');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const title = variant === 'trip' ? 'Withdraw from trip?' : 'Cancel join request?';
  const confirmLabel = variant === 'trip' ? 'Withdraw' : 'Cancel request';
  const needsMessage = reason === 'other';

  const handleSubmit = async () => {
    if (needsMessage && message.trim().length < 3) {
      setError('Please tell us a bit more when selecting Other.');
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

        <label className="block text-xs font-bold uppercase tracking-wide text-neutral-400 mb-1.5">
          Reason
        </label>
        <select
          value={reason}
          onChange={(e) => {
            setReason(e.target.value as WithdrawReason);
            setError(null);
          }}
          disabled={submitting}
          className="ios-input w-full text-[15px] mb-4"
        >
          {WITHDRAW_REASONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="block text-xs font-bold uppercase tracking-wide text-neutral-400 mb-1.5">
          {needsMessage ? 'Tell us more (required)' : 'Additional note (optional)'}
        </label>
        <textarea
          className="ios-input text-[15px] min-h-[88px] resize-none mb-2"
          placeholder={
            needsMessage
              ? 'Briefly explain why you are withdrawing…'
              : 'Anything else for the organizer?'
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          maxLength={500}
        />
        <p className="text-[11px] text-neutral-400 mb-4">{message.length}/500</p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex gap-3">
          <AppButton variant="secondary" fullWidth onClick={handleClose} disabled={submitting}>
            Keep spot
          </AppButton>
          <AppButton variant="destructive" fullWidth onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : confirmLabel}
          </AppButton>
        </div>
    </Dialog>
  );
};
