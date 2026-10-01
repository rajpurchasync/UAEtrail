import { ORGANIZE_LINK_RIDESHARE_LABEL } from '../createFlowCopy';

type ExploreDemandOwnerPeekActionsProps = {
  onDelete: () => void;
  showLinkRideshare?: boolean;
  onLinkRideshare?: () => void;
  onGuestGatedAction?: () => void;
};

const linkButtonClass =
  'text-sm font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950';

/** Requester peek on their own demand — Delete + optional rideshare offer (no check-in). */
export const ExploreDemandOwnerPeekActions = ({
  onDelete,
  showLinkRideshare = false,
  onLinkRideshare,
  onGuestGatedAction,
}: ExploreDemandOwnerPeekActionsProps) => {
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
        onClick={() => runGated(onDelete)}
        className="w-full rounded-xl border border-red-200 bg-white py-3.5 text-sm font-bold text-red-700"
      >
        Delete
      </button>

      {showLinkRideshare && onLinkRideshare ? (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <button
            type="button"
            onClick={() => runGated(onLinkRideshare)}
            className={linkButtonClass}
          >
            {ORGANIZE_LINK_RIDESHARE_LABEL}
          </button>
        </div>
      ) : null}
    </div>
  );
};
