import {
  JOIN_CANCEL_REQUEST_BUTTON,
  JOIN_WITHDRAW_APPROVED_REQUEST_BUTTON,
  JOIN_WITHDRAW_PENDING_HINT,
} from '../../content/joinWithdrawCopy';
import type { JoinRequestUiState } from '../../utils/joinRequestUi';
import { pendingApprovalLabel } from '../../utils/joinRequestUi';

interface JoinRequestActionsProps {
  uiState: JoinRequestUiState;
  joinLabel: string;
  isFull?: boolean;
  onJoin?: () => void;
  onWithdraw?: () => void;
  joinDisabled?: boolean;
  className?: string;
  joinButtonClassName?: string;
  /** Post-auth scroll/focus target for join CTA. */
  joinCtaMarker?: 'activity' | 'explore';
}

export const JoinRequestActions = ({
  uiState,
  joinLabel,
  isFull = false,
  onJoin,
  onWithdraw,
  joinDisabled = false,
  className = '',
  joinButtonClassName = '',
  joinCtaMarker = 'activity',
}: JoinRequestActionsProps) => {
  const joinCtaDataProps =
    joinCtaMarker === 'explore'
      ? { 'data-explore-join-cta': true }
      : { 'data-activity-join-cta': true };
  if (uiState.kind === 'pending') {
    return (
      <div className={`space-y-2 ${className}`}>
        <button
          type="button"
          disabled
          className="w-full rounded-2xl bg-amber-100 py-3.5 text-base font-bold text-amber-900 disabled:opacity-100"
        >
          {pendingApprovalLabel(uiState.status)}
        </button>
        {onWithdraw && (
          <button
            type="button"
            onClick={onWithdraw}
            className="w-full py-2.5 text-center text-sm font-semibold text-red-600"
          >
            {JOIN_CANCEL_REQUEST_BUTTON}
          </button>
        )}
        <p className="text-center text-xs text-neutral-500">{JOIN_WITHDRAW_PENDING_HINT}</p>
      </div>
    );
  }

  if (uiState.kind === 'confirmed') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={onWithdraw}
          className="w-full rounded-2xl border-2 border-red-200 bg-white py-3.5 text-base font-bold text-red-600"
        >
          {JOIN_WITHDRAW_APPROVED_REQUEST_BUTTON}
        </button>
      </div>
    );
  }

  const joinBlocked = joinDisabled || isFull;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onJoin}
        disabled={joinBlocked}
        className={`w-full rounded-2xl py-3.5 text-base font-bold disabled:cursor-not-allowed ${
          isFull
            ? 'bg-neutral-200 text-neutral-500 disabled:opacity-100'
            : 'bg-emerald-500 text-white disabled:opacity-60'
        } ${joinButtonClassName}`}
        {...joinCtaDataProps}
      >
        {joinLabel}
      </button>
    </div>
  );
};
