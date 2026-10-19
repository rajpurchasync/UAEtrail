import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { MapPeekShell, MapPeekActionsSlot, MapPeekBodySlot } from '../map-peek';

export type ActivityPeekCardProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onGuestGatedAction?: () => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  onOpenExploreItem?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  joinInvitePeekBanner?: string | null;
  embedMode?: boolean;
};

/**
 * Hosted + seeking activity map peek (map/list).
 * Detail depth: `card.path` → kind `*ActivityDetailPage` on `/activity/:id`.
 */
export const ActivityPeekCard = ({
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
  joinInvitePeekBanner = null,
  embedMode = false,
}: ActivityPeekCardProps) => (
  <MapPeekShell
    card={card}
    onClose={onClose}
    joinStateLoading={joinStateLoading}
    onGuestGatedAction={onGuestGatedAction}
    statusBanner={joinInvitePeekBanner}
    embedMode={embedMode}
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
      />
    }
  >
    <MapPeekBodySlot
      card={card}
      onGuestGatedAction={onGuestGatedAction}
      onOpenLinkedPin={onOpenExploreItem}
      onOfferTransport={onOfferTransport}
      joinUiState={joinUiState}
    />
  </MapPeekShell>
);
