import { useState } from 'react';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';
import { canLinkRideshareToActivity } from '../linkActivityRideshareOffer';
import type { ExploreCardModel } from '../exploreCardModel';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { EXPLORE_Z } from '../../config/exploreTheme';

export type ExploreHostPeekHandlers = {
  onChat: () => void;
  onViewParticipants: () => void;
  onInvite: () => void;
  onAddCarpool?: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

type ExploreHostPeekActionsProps = {
  card: ExploreCardModel;
  linkRideshareTenantId: string | null;
  handlers: ExploreHostPeekHandlers;
  onGuestGatedAction?: () => void;
};

const manageRowClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-neutral-900 active:bg-neutral-50';

/** Host’s own activity on the map — Chat + Manage (participants, invite, carpool, delete, duplicate). */
export const ExploreHostPeekActions = ({
  card,
  linkRideshareTenantId,
  handlers,
  onGuestGatedAction,
}: ExploreHostPeekActionsProps) => {
  const [manageOpen, setManageOpen] = useState(false);
  const activity = card.activity;
  const published = activity?.status === 'published';
  const showCarpool =
    Boolean(
      handlers.onAddCarpool &&
        linkRideshareTenantId &&
        activity &&
        canLinkRideshareToActivity(activity)
    );

  const runGated = (action: () => void) => {
    if (onGuestGatedAction) {
      onGuestGatedAction();
      return;
    }
    action();
  };

  const runManageAction = (action: () => void) => {
    setManageOpen(false);
    runGated(action);
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => runGated(handlers.onChat)}
          className={`min-w-0 flex-1 ${EXPLORE_PEEK_CTA.primary}`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => runGated(() => setManageOpen(true))}
          className={`min-w-0 flex-1 ${EXPLORE_PEEK_CTA.secondary}`}
        >
          Manage
        </button>
      </div>

      <ExploreResponsiveSheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        zClass={EXPLORE_Z.composeFlow}
        maxWidthClass="max-w-md"
        ariaLabel="Manage activity"
      >
        <div className="space-y-2 px-1 pb-[calc(var(--safe-bottom)+8px)] pt-1">
          <p className="px-1 pb-1 text-center text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Manage
          </p>
          <button
            type="button"
            className={manageRowClass}
            onClick={() => runManageAction(handlers.onViewParticipants)}
          >
            View participants
          </button>
          {published ? (
            <button
              type="button"
              className={manageRowClass}
              onClick={() => runManageAction(handlers.onInvite)}
            >
              Invite
            </button>
          ) : null}
          {showCarpool ? (
            <button
              type="button"
              className={manageRowClass}
              onClick={() => runManageAction(handlers.onAddCarpool!)}
            >
              Add carpool
            </button>
          ) : null}
          <button
            type="button"
            className={manageRowClass}
            onClick={() => runManageAction(handlers.onDuplicate)}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-red-200 bg-white px-4 py-3.5 text-left text-sm font-bold text-red-700 active:bg-red-50"
            onClick={() => runManageAction(handlers.onDelete)}
          >
            Delete
          </button>
        </div>
      </ExploreResponsiveSheet>
    </>
  );
};
