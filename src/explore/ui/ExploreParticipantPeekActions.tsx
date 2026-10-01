import { Link } from 'react-router-dom';

type ExploreParticipantPeekActionsProps = {
  activityId: string;
  onInviteCrew: () => void;
  onGuestGatedAction?: () => void;
};

/** Confirmed participant — invite friends + open full detail. */
export const ExploreParticipantPeekActions = ({
  activityId,
  onInviteCrew,
  onGuestGatedAction,
}: ExploreParticipantPeekActionsProps) => {
  const runGated = (action: () => void) => {
    if (onGuestGatedAction) {
      onGuestGatedAction();
      return;
    }
    action();
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => runGated(onInviteCrew)}
        className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white"
      >
        Invite your crew
      </button>
      {onGuestGatedAction ? (
        <button
          type="button"
          onClick={onGuestGatedAction}
          className="block w-full rounded-xl border border-neutral-200 py-3.5 text-center text-sm font-bold text-neutral-800"
        >
          View full details
        </button>
      ) : (
        <Link
          to={`/activity/${activityId}`}
          className="block w-full rounded-xl border border-neutral-200 py-3.5 text-center text-sm font-bold text-neutral-800"
        >
          View full details
        </Link>
      )}
    </div>
  );
};
