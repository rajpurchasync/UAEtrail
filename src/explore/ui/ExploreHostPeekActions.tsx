import type { ActivityDTO } from '@uaetrail/shared-types';
import { activityHasJoinedParticipants } from '@uaetrail/shared-types';
import { ORGANIZE_LINK_RIDESHARE_LABEL } from '../createFlowCopy';
import { canLinkRideshareToActivity } from '../linkActivityRideshareOffer';
import type { ExploreCardModel } from '../exploreCardModel';

type ExploreHostPeekActionsProps = {
  card: ExploreCardModel;
  linkRideshareTenantId: string | null;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
  onMessage: () => void;
  onHostRemove?: () => void;
  onManage?: () => void;
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
  onManage,
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

  const showCheckIn =
    activity?.status === 'published' &&
    Boolean(onManage) &&
    activityHasJoinedParticipants(activity);

  const runGated = (action: () => void) => {
    if (gate) {
      gate();
      return;
    }
    action();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => runGated(onMessage)}
          className="rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-white"
        >
          Message
        </button>
        {onHostRemove ? (
          <button
            type="button"
            onClick={() => runGated(onHostRemove)}
            className="rounded-xl border border-red-200 bg-white py-3.5 text-sm font-bold text-red-700"
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
