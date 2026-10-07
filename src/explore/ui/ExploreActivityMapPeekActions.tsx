import type { ActivityMapPeekAction, ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';
import { activityMapPeekActionLabel } from '../exploreMapPeekActionCopy';
import { canLinkRideshareToActivity } from '../linkActivityRideshareOffer';
import type { ExploreCardModel } from '../exploreCardModel';
import { ExplorePeekDetailLink } from './ExplorePeekDetailLink';

type ExploreActivityMapPeekActionsProps = {
  card: ExploreCardModel;
  actions: ActivityMapPeekAction[];
  linkRideshareTenantId: string | null;
  onAction: (id: ActivityMapPeekActionId) => void;
  onGuestGatedAction?: () => void;
  joinStateLoading?: boolean;
  onBeforeDetailNavigate?: () => void;
};

const prominenceClass = (prominence: ActivityMapPeekAction['prominence']): string => {
  switch (prominence) {
    case 'primary':
      return EXPLORE_PEEK_CTA.primary;
    case 'secondary':
      return EXPLORE_PEEK_CTA.secondary;
    case 'link':
      return `block w-full text-center ${EXPLORE_PEEK_CTA.link}`;
    case 'text':
      return EXPLORE_PEEK_CTA.secondaryText;
    default:
      return EXPLORE_PEEK_CTA.primary;
  }
};

/** Activity map peek — render `viewerAccess.mapPeekActions` (wire ids, not roles). */
export const ExploreActivityMapPeekActions = ({
  card,
  actions,
  linkRideshareTenantId,
  onAction,
  onGuestGatedAction,
  joinStateLoading = false,
  onBeforeDetailNavigate,
}: ExploreActivityMapPeekActionsProps) => {
  const gate = onGuestGatedAction;
  const activity = card.activity;

  const runGated = (id: ActivityMapPeekActionId) => {
    if (gate) {
      gate();
      return;
    }
    onAction(id);
  };

  const visible = actions.filter((action) => {
    if (action.id !== 'link_carpool') return true;
    return Boolean(linkRideshareTenantId && activity && canLinkRideshareToActivity(activity));
  });

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      {visible.map((action) => {
        if (action.id === 'view_detail') {
          const className = prominenceClass(action.prominence);
          const label = activityMapPeekActionLabel(action.id, action);
          return (
            <ExplorePeekDetailLink
              key={action.id}
              card={card}
              label={label}
              className={className}
              joinStateLoading={joinStateLoading}
              onGuestGatedAction={gate}
              onBeforeNavigate={onBeforeDetailNavigate}
            />
          );
        }

        if (action.id === 'pending_join') {
          return (
            <div key={action.id} className="space-y-2">
              <button
                type="button"
                disabled
                className="w-full rounded-2xl bg-amber-100 py-3.5 text-base font-bold text-amber-900 disabled:opacity-100"
              >
                {activityMapPeekActionLabel(action.id, action)}
              </button>
              <p className="text-center text-xs text-neutral-500">
                To withdraw your request, open full details — comment required for the host.
              </p>
            </div>
          );
        }

        const joinLabel =
          action.id === 'request_join' ? card.primaryCta : activityMapPeekActionLabel(action.id, action);

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => runGated(action.id)}
            className={
              action.id === 'request_join'
                ? 'w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white'
                : prominenceClass(action.prominence)
            }
          >
            {joinLabel}
          </button>
        );
      })}
    </div>
  );
};
