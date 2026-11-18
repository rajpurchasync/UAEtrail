import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import { Share2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { EXPLORE_PEEK } from '../../../config/exploreTheme';
import { ShareButton } from '../../../components/ui/ShareButton';
import { UiTooltip } from '../../../components/ui/UiTooltip';
import { shareSurfaceFromDiscoveryCard } from '../../../content/shareSheetCopy';
import { resolvePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';
import { mapPeekDetailNavState } from '../../mapPeekDetailNavState';
import { activityPeekHasMapWireActions } from '../../../activity/activityPeekEngagement';
import { useAuth } from '../../../context/AuthContext';
import { viewerIsActivityHostUser } from '../../../utils/viewerHostsActivity';
import { ActivityMapPeekCompactLayout } from '../peek/activity/ActivityMapPeekCompactLayout';
import { ActivityPeekActions } from '../peek/activity/ActivityPeekActions';

export type MapTripPeekCardProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  onGuestGatedAction?: (action: ActivityMapPeekActionId) => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  joinInvitePeekBanner?: string | null;
  onShareActivity?: () => void;
};

/** Map-only trip peek — reference layout (host-first, stat grid, dual footer). */
export const MapTripPeekCard = ({
  card,
  onClose,
  onJoin,
  joinUiState,
  onWithdraw,
  joinStateLoading = false,
  onGuestGatedAction,
  onActivityMapPeekAction,
  onOpenExploreItem,
  joinInvitePeekBanner = null,
  onShareActivity,
}: MapTripPeekCardProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const shellGuestGate = onGuestGatedAction ? () => onGuestGatedAction('view_detail') : undefined;

  const activity = card.activity;
  const hostOnRecord = Boolean(activity && (activity.hostUserId || activity.hostId));
  const isHostUser =
    activity && hostOnRecord
      ? viewerIsActivityHostUser(activity, user?.id)
      : card.viewerAccess?.level === 'host';

  const titleDetailAccess = resolvePeekDetailAccess(card, {
    isGuest: Boolean(onGuestGatedAction),
    joinStateLoading: activityPeekHasMapWireActions(card) ? false : joinStateLoading,
  });
  const detailLinkState = mapPeekDetailNavState(location);

  const chromeActions = (
    <>
      {onShareActivity ? (
        <UiTooltip label="Share">
          <button
            type="button"
            aria-label="Share"
            className={EXPLORE_PEEK.tripShareBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShareActivity();
            }}
          >
            <Share2 className="h-4 w-4" aria-hidden />
          </button>
        </UiTooltip>
      ) : card.sharePath ? (
        <ShareButton
          title={card.shareTitle}
          text={card.shareText ?? undefined}
          path={card.sharePath}
          shareSurface={shareSurfaceFromDiscoveryCard(card)}
          iconOnly
          light
          bare
        />
      ) : null}
    </>
  );

  return (
    <div className={EXPLORE_PEEK.shell} data-map-trip-peek-card data-pin-summary="card">
      <section className="relative shrink-0 px-4 pb-2 pt-3">
        <div className="absolute right-3 top-2 z-10 flex items-center gap-1">{chromeActions}</div>
        {joinInvitePeekBanner ? (
          <p
            className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-xs font-medium leading-snug text-emerald-900"
            role="status"
          >
            {joinInvitePeekBanner}
          </p>
        ) : null}
        <ActivityMapPeekCompactLayout
          card={card}
          joinUiState={joinUiState}
          isHostUser={Boolean(isHostUser)}
          titleDetailAccess={titleDetailAccess}
          detailLinkState={detailLinkState}
          onGuestGatedAction={shellGuestGate}
          onBeforeDetailNavigate={onClose}
          onOpenLinkedPin={onOpenExploreItem}
        />
      </section>
      <footer className="shrink-0 border-t border-neutral-100 px-4 py-3">
        <ActivityPeekActions
          card={card}
          onClose={onClose}
          onJoin={onJoin}
          onWithdraw={onWithdraw}
          joinUiState={joinUiState}
          joinStateLoading={joinStateLoading}
          onGuestGatedAction={onGuestGatedAction}
          onActivityMapPeekAction={onActivityMapPeekAction}
          mapPeekCompact
        />
      </footer>
    </div>
  );
};