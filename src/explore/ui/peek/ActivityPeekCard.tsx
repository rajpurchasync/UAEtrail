import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { MapPeekShell, MapPeekActionsSlot, MapPeekBodySlot } from '../map-peek';
import { MapTripPeekCard } from '../map-peek/MapTripPeekCard';
import { useLocation } from 'react-router-dom';
import { resolvePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';
import { mapPeekDetailNavState } from '../../mapPeekDetailNavState';
import { activityPeekHasMapWireActions } from '../../../activity/activityPeekEngagement';

export type ActivityPeekCardProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onGuestGatedAction?: (action: ActivityMapPeekActionId) => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  onOfferRideshare?: () => void;
  joinInvitePeekBanner?: string | null;
  embedMode?: boolean;
  showDismissChrome?: boolean;
  onShareActivity?: () => void;
};

/**
 * Activity peek facade — map pins use {@link MapTripPeekCard}; embed/list rails use legacy shell.
 */
const ActivityPeekCardEmbed = (props: ActivityPeekCardProps) => {
  const {
    card,
    onClose,
    onJoin,
    onMessage,
    joinUiState,
    onWithdraw,
    joinStateLoading = false,
    linkRideshareTenantId = null,
    onGuestGatedAction,
    onActivityMapPeekAction,
    onOpenExploreItem,
    onOfferTransport,
    onOfferRideshare,
    joinInvitePeekBanner = null,
    showDismissChrome,
    onShareActivity,
  } = props;

  const location = useLocation();
  const shellGuestGate = onGuestGatedAction ? () => onGuestGatedAction('view_detail') : undefined;
  const titleDetailAccess = resolvePeekDetailAccess(card, {
    isGuest: Boolean(onGuestGatedAction),
    joinStateLoading: activityPeekHasMapWireActions(card) ? false : joinStateLoading,
  });
  const detailLinkState = mapPeekDetailNavState(location);

  return (
    <MapPeekShell
      card={card}
      onClose={onClose}
      joinStateLoading={joinStateLoading}
      onGuestGatedAction={shellGuestGate}
      statusBanner={joinInvitePeekBanner}
      embedMode
      showDismissChrome={showDismissChrome}
      onShareActivity={onShareActivity}
      actions={
        <MapPeekActionsSlot
          card={card}
          onClose={onClose}
          onJoin={onJoin}
          onMessage={onMessage}
          linkRideshareTenantId={linkRideshareTenantId}
          joinUiState={joinUiState}
          onWithdraw={onWithdraw}
          joinStateLoading={joinStateLoading}
          onGuestGatedAction={onGuestGatedAction}
          onActivityMapPeekAction={onActivityMapPeekAction}
          onOfferRideshare={onOfferRideshare}
          mapPeekCompact={false}
        />
      }
    >
      <MapPeekBodySlot
        card={card}
        onGuestGatedAction={shellGuestGate}
        onOpenLinkedPin={onOpenExploreItem}
        onOfferTransport={onOfferTransport}
        joinUiState={joinUiState}
        mapPeekCompact={false}
        titleDetailAccess={titleDetailAccess}
        detailLinkState={detailLinkState}
        onBeforeDetailNavigate={onClose}
      />
    </MapPeekShell>
  );
};

/**
 * Activity peek facade — map pins use {@link MapTripPeekCard}; embed/list rails use legacy shell.
 */
export const ActivityPeekCard = (props: ActivityPeekCardProps) => {
  const { embedMode = false, ...mapProps } = props;
  if (!embedMode) {
    return <MapTripPeekCard {...mapProps} />;
  }
  return <ActivityPeekCardEmbed {...props} />;
};