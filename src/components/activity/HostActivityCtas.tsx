import { useState } from 'react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { MoreHorizontal } from 'lucide-react';
import { ACTIVITY_INVITE_FRIENDS_CTA } from '../../content/activityInviteCopy';
import { ACTIVITY_PARTICIPANTS_SECTION_LABEL } from '../../content/activityParticipantsCopy';
import { EXPLORE_PEEK_CTA, EXPLORE_Z } from '../../config/exploreTheme';
import { activityManageCapabilities } from '../../activity/activityManageCapabilities';
import { ExploreResponsiveSheet } from '../../explore/ui/ExploreResponsiveSheet';

export type HostActivityCtaHandlers = {
  onChat: () => void;
  onViewParticipants: () => void;
  onInvite: () => void;
  onAddCarpool?: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

type HostActivityCtasProps = {
  activity: ActivityDTO;
  linkRideshareTenantId: string | null;
  /** Wire `viewerAccess.entitlements.canAddLinkedRide`. */
  canAddLinkedRide?: boolean;
  handlers: HostActivityCtaHandlers;
  disabled?: boolean;
  /** Map peek — sign-up instead of host actions. */
  onGuestGatedAction?: () => void;
  /** Plan tab — icon-only overflow (no chat/manage row). */
  variant?: 'default' | 'menuOnly';
};

const manageRowClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-neutral-900 active:bg-neutral-50';

/** Host’s own activity — Chat + Manage on map peek and activity detail. */
export const HostActivityCtas = ({
  activity,
  linkRideshareTenantId,
  canAddLinkedRide = false,
  handlers,
  disabled = false,
  onGuestGatedAction,
  variant = 'default',
}: HostActivityCtasProps) => {
  const [manageOpen, setManageOpen] = useState(false);
  const caps = activityManageCapabilities(activity, { canAddLinkedRide });
  const published = activity.status === 'published';
  const showChat = caps.showGroupChat;
  const showCarpool = Boolean(handlers.onAddCarpool && linkRideshareTenantId && caps.showLinkRideshare);

  const run = (action: () => void) => {
    if (onGuestGatedAction) {
      onGuestGatedAction();
      return;
    }
    action();
  };

  const runManageAction = (action: () => void) => {
    setManageOpen(false);
    run(action);
  };

  const manageSheet = (
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
          {ACTIVITY_PARTICIPANTS_SECTION_LABEL}
        </button>
        {published ? (
          <button
            type="button"
            className={manageRowClass}
            onClick={() => runManageAction(handlers.onInvite)}
          >
            {ACTIVITY_INVITE_FRIENDS_CTA}
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
  );

  if (variant === 'menuOnly') {
    return (
      <>
        <button
          type="button"
          disabled={disabled}
          onClick={() => run(() => setManageOpen(true))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 active:bg-neutral-50 disabled:opacity-50"
          aria-label="Plan options"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
        </button>
        {manageSheet}
      </>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        {showChat ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => run(handlers.onChat)}
            className={`min-w-0 flex-1 ${EXPLORE_PEEK_CTA.primary} disabled:opacity-50`}
          >
            Chat
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={() => run(() => setManageOpen(true))}
          className={`min-w-0 ${showChat ? 'flex-1' : 'w-full'} ${EXPLORE_PEEK_CTA.secondary} disabled:opacity-50`}
        >
          Manage
        </button>
      </div>

      {manageSheet}
    </>
  );
};
