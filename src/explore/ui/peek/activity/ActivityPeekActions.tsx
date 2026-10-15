import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import {
  discoveryCardUsesActivityPeekEngagement,
  exploreCardActivityJoinIsFull,
  exploreCardHasMapCoords,
  exploreCardPeekShowsDirections,
  exploreCardShowsInlineDirections,
} from '../../../../discovery/discoveryCardModel';
import {
  activityPeekHasMapWireActions,
  resolveActivityPeekEngagement,
} from '../../../../activity/activityPeekEngagement';
import { JoinRequestActions } from '../../../../components/ui/JoinRequestActions';
import type { JoinRequestUiState } from '../../../../utils/joinRequestUi';
import { ActivityPeekEngagementActions } from './ActivityPeekEngagementActions';
import { ExploreCardDirectionsButton } from '../../ExploreCardPresentation';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';

export type ActivityPeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onGuestGatedAction?: () => void;
};

const PeekLoading = () => (
  <div className="flex justify-center py-3">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
  </div>
);

/** Hosted + seeking activity peek — `viewerAccess.mapPeekActions` (+ join fallback). */
export const ActivityPeekActions = ({
  card,
  onClose,
  onJoin,
  onActivityMapPeekAction,
  joinUiState,
  joinStateLoading = false,
  linkRideshareTenantId = null,
  onGuestGatedAction,
}: ActivityPeekActionsProps) => {
  const gate = onGuestGatedAction;

  const effectiveJoinStateLoading = activityPeekHasMapWireActions(card) ? false : joinStateLoading;

  const detailLink = (label: string, className: string) => (
    <PeekDetailLink
      card={card}
      label={label}
      className={className}
      joinStateLoading={effectiveJoinStateLoading}
      onGuestGatedAction={gate}
      onBeforeNavigate={onClose}
    />
  );

  if (!discoveryCardUsesActivityPeekEngagement(card)) {
    return detailLink(
      card.secondaryCta ?? 'View details',
      'block w-full rounded-2xl bg-neutral-100 py-3.5 text-center text-base font-bold text-gray-900'
    );
  }

  const engagement = resolveActivityPeekEngagement(card, joinUiState);
  const wireActions = engagement.mapPeekActions;

  if (wireActions.length > 0 && onActivityMapPeekAction) {
    return (
      <ActivityPeekEngagementActions
        card={card}
        actions={wireActions}
        linkRideshareTenantId={linkRideshareTenantId}
        onAction={onActivityMapPeekAction}
        onGuestGatedAction={gate}
        joinStateLoading={effectiveJoinStateLoading}
        onBeforeDetailNavigate={onClose}
        joinUiState={joinUiState}
      />
    );
  }

  if (engagement.showsLegacyJoinFlow && joinStateLoading && !activityPeekHasMapWireActions(card)) {
    return <PeekLoading />;
  }

  if (engagement.showsLegacyJoinFlow && joinUiState) {
    return (
      <>
        <JoinRequestActions
          uiState={joinUiState}
          joinLabel={card.primaryCta}
          isFull={exploreCardActivityJoinIsFull(card)}
          onJoin={gate ?? onJoin}
          joinCtaMarker="explore"
        />
        {card.secondaryCta ? (
          detailLink(
            card.secondaryCta,
            'block w-full py-2.5 text-center text-sm font-semibold text-gray-600'
          )
        ) : null}
      </>
    );
  }

  if (card.showJoinActions && onJoin) {
    return (
      <>
        {gate &&
        exploreCardPeekShowsDirections(card) &&
        exploreCardHasMapCoords(card) &&
        !exploreCardShowsInlineDirections(card) ? (
          <ExploreCardDirectionsButton latitude={card.mapLatitude} longitude={card.mapLongitude} />
        ) : null}
        {detailLink(
          card.primaryCta,
          'block w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-white'
        )}
      </>
    );
  }

  return detailLink(
    card.secondaryCta ?? 'View details',
    'block w-full rounded-2xl bg-neutral-100 py-3.5 text-center text-base font-bold text-gray-900'
  );
};
