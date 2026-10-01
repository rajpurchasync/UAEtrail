import type { ActivityDTO } from '@uaetrail/shared-types';
import { ORGANIZE_LINK_RIDESHARE_LABEL } from '../createFlowCopy';
import { canLinkRideshareToActivity } from '../linkActivityRideshareOffer';
import type { ExploreCardModel } from '../exploreCardModel';

type ExploreHostPeekActionsProps = {
  card: ExploreCardModel;
  linkRideshareTenantId: string | null;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onMessage?: () => void;
  onHostRemove?: () => void;
  /** Opens full manage sheet (Trips → Hosted). */
  onFullManage?: () => void;
  /** Check-in subview (optional underline link). */
  onManage?: () => void;
  onInviteCrew?: () => void;
  onGuestGatedAction?: () => void;
};

const linkButtonClass =
  'text-sm font-semibold text-sky-800 underline underline-offset-2 hover:text-sky-950';

/** Host peek footer — Message + Delete; optional underlined check-in and link carpool. */
export const ExploreHostPeekActions = ({
  card,
  linkRideshareTenantId,
  onCreateLinkedRideshare,
  onMessage,
  onHostRemove,
  onFullManage,
  onManage,
  onInviteCrew,
  onGuestGatedAction,
}: ExploreHostPeekActionsProps) => {
  const gate = onGuestGatedAction;
  const activity = card.activity;

  const canLinkRideshare = Boolean(
    linkRideshareTenantId &&
      activity &&
      onCreateLinkedRideshare &&
      canLinkRideshareToActivity(activity)
  );

  const showCheckIn = activity?.status === 'published' && Boolean(onManage);

  const runGated = (action: () => void) => {
    if (gate) {
      gate();
      return;
    }
    action();
  };

  return (
    <div className="space-y-3">
      {onFullManage ? (
        <button
          type="button"
          onClick={() => runGated(onFullManage)}
          className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white"
        >
          Manage outing
        </button>
      ) : null}
      {onInviteCrew && activity?.status === 'published' ? (
        <button
          type="button"
          onClick={() => runGated(onInviteCrew)}
          className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 text-sm font-bold text-neutral-900"
        >
          Invite your crew
        </button>
      ) : null}
      <div className={onMessage && onHostRemove ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
        {onMessage ? (
          <button
            type="button"
            onClick={() => runGated(onMessage)}
            className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white"
          >
            Message
          </button>
        ) : null}
        {onHostRemove ? (
          <button
            type="button"
            onClick={() => runGated(onHostRemove)}
            className="w-full rounded-xl border border-red-200 bg-white py-3.5 text-sm font-bold text-red-700"
          >
            Delete
          </button>
        ) : null}
      </div>

      {showCheckIn || canLinkRideshare ? (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {showCheckIn ? (
            <button type="button" onClick={() => runGated(() => onManage!())} className={linkButtonClass}>
              Check in attendees
            </button>
          ) : null}
          {canLinkRideshare && activity ? (
            <button
              type="button"
              onClick={() => runGated(() => onCreateLinkedRideshare!(activity))}
              className={linkButtonClass}
            >
              {ORGANIZE_LINK_RIDESHARE_LABEL}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
