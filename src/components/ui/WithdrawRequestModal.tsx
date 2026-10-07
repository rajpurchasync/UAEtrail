import { useEffect, useState } from 'react';
import { WITHDRAW_REASONS, WithdrawReason } from '@uaetrail/shared-types';
import {
  WITHDRAW_MODAL_COMMENT_LABEL,
  WITHDRAW_MODAL_COMMENT_REQUIRED_HINT,
  WITHDRAW_MODAL_CONFIRM_APPROVED,
  WITHDRAW_MODAL_CONFIRM_PENDING,
  WITHDRAW_MODAL_KEEP_SPOT,
  WITHDRAW_MODAL_REASON_LABEL,
  WITHDRAW_MODAL_TITLE_APPROVED,
  WITHDRAW_MODAL_TITLE_PENDING,
} from '../../content/joinWithdrawCopy';
import { AppButton } from '../mobile/AppButton';
import { AppSelect } from './AppSelect';
import { Dialog } from './Dialog';

export interface WithdrawRequestModalProps {
  open: boolean;
  onClose: () => void;
  activityTitle: string;
  activityDate?: string;
  /** pending vs confirmed wording */
  variant?: 'request' | 'activity';
  submitting?: boolean;
  onConfirm: (payload: { reason: WithdrawReason; message?: string }) => void | Promise<void>;
}

const MIN_COMMENT_LENGTH = 3;

export const WithdrawRequestModal = ({
  open,
  onClose,
  activityTitle,
  activityDate,
  variant = 'request',
  submitting = false,
  onConfirm,
}: WithdrawRequestModalProps) => {
  const [reason, setReason] = useState<WithdrawReason | ''>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setMessage('');
    setError(null);
  }, [open, activityTitle]);

  const title = variant === 'activity' ? WITHDRAW_MODAL_TITLE_APPROVED : WITHDRAW_MODAL_TITLE_PENDING;
  const confirmLabel =
    variant === 'activity' ? WITHDRAW_MODAL_CONFIRM_APPROVED : WITHDRAW_MODAL_CONFIRM_PENDING;
  const canSubmit =
    Boolean(reason) && message.trim().length >= MIN_COMMENT_LENGTH;

  const handleSubmit = async () => {
    if (!reason) {
      setError('Pick a reason so the host knows what happened.');
      return;
    }
    if (message.trim().length < MIN_COMMENT_LENGTH) {
      setError(WITHDRAW_MODAL_COMMENT_REQUIRED_HINT);
      return;
    }
    setError(null);
    await onConfirm({
      reason,
      message: message.trim(),
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
        {variant === 'activity'
          ? 'You are withdrawing your approved request for'
          : 'You are cancelling your request for'}{' '}
        <strong>{activityTitle}</strong>
        {activityDate ? <> on {activityDate}</> : null}.
      </p>

      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {WITHDRAW_MODAL_REASON_LABEL} <span className="text-red-500">*</span>
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
        {WITHDRAW_MODAL_COMMENT_LABEL} <span className="text-red-500">*</span>
      </label>
      <textarea
        className="ios-input text-[15px] min-h-[88px] resize-none mb-2"
        placeholder="Briefly tell the host what changed…"
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
          {WITHDRAW_MODAL_KEEP_SPOT}
        </AppButton>
        <AppButton variant="destructive" fullWidth onClick={handleSubmit} disabled={submitting || !canSubmit}>
          {submitting ? 'Submitting…' : confirmLabel}
        </AppButton>
      </div>
    </Dialog>
  );
};
