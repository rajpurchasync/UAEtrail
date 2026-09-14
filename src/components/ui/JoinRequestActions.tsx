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
}: JoinRequestActionsProps) => {
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
          Cancel request
          </button>
        )}
        <p className="text-center text-xs text-neutral-500">We&apos;ll let you know when the host replies</p>
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
          Leave activity
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onJoin}
        disabled={joinDisabled}
        className={`w-full rounded-2xl py-3.5 text-base font-bold text-white disabled:opacity-60 ${
          isFull ? 'bg-amber-500' : 'bg-emerald-500'
        } ${joinButtonClassName}`}
      >
        {joinLabel}
      </button>
    </div>
  );
};
