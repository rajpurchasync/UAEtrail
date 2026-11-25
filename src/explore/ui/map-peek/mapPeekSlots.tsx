import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import type { ExplorePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';
import type { MapPeekDetailNavState } from '../../mapPeekDetailNavState';
import { ActivityPeekActions } from '../peek/activity/ActivityPeekActions';
import { ActivityPeekBody } from '../peek/activity/ActivityPeekBody';
import { DestinationPeekActions } from '../peek/destination/DestinationPeekActions';
import { DestinationPeekBody } from '../peek/destination/DestinationPeekBody';
import { CatalogPeekBody } from '../peek/catalog/CatalogPeekBody';
import { ShopPeekActions } from '../peek/shop/ShopPeekActions';
import { AvailabilityPeekActions } from '../peek/availability/AvailabilityPeekActions';

/**
 * Routes pin-summary body/actions by `card.source` — the only place that branches on wire source
 * for the activity pin host. Entity modules stay source-agnostic where possible.
 */
export type MapPeekActionsSlotProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onJoin?: () => void;
  onMessage?: () => void;
  onActivityMapPeekAction?: (actionId: ActivityMapPeekActionId) => void;
  joinUiState?: JoinRequestUiState;
  onWithdraw?: () => void;
  joinStateLoading?: boolean;
  linkRideshareTenantId?: string | null;
  onOfferRideshare?: () => void;
  onGuestGatedAction?: (action: ActivityMapPeekActionId) => void;
  mapPeekCompact?: boolean;
};

export const MapPeekActionsSlot = ({
  card,
  onClose,
  ...rest
}: MapPeekActionsSlotProps) => {
  if (card.source === 'area' && card.destinationSlug) {
    return (
      <DestinationPeekActions
        destinationSlug={card.destinationSlug}
        stats={card.areaLensStats}
        areaPagePath={card.path}
        onClose={onClose}
      />
    );
  }

  if (card.source === 'availability') {
    return (
      <AvailabilityPeekActions
        card={card}
        onClose={onClose}
        onMessage={rest.onMessage}
        onOfferRideshare={rest.onOfferRideshare}
        onGuestGatedAction={rest.onGuestGatedAction}
      />
    );
  }

  if (card.source === 'shop') {
    const externalUrl = card.websiteUrl?.trim() || null;
    return (
      <ShopPeekActions
        card={card}
        onClose={onClose}
        onGuestGatedAction={
          rest.onGuestGatedAction ? () => rest.onGuestGatedAction!('view_detail') : undefined
        }
        externalUrl={externalUrl}
      />
    );
  }

  return (
    <ActivityPeekActions card={card} onClose={onClose} {...rest} mapPeekCompact={rest.mapPeekCompact ?? true} />
  );
};

export type MapPeekBodySlotProps = {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
  onOpenLinkedPin?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  joinUiState?: JoinRequestUiState;
  mapPeekCompact?: boolean;
  titleDetailAccess?: ExplorePeekDetailAccess | null;
  detailLinkState?: MapPeekDetailNavState;
  onBeforeDetailNavigate?: () => void;
};

export const MapPeekBodySlot = ({
  card,
  onGuestGatedAction,
  onOpenLinkedPin,
  onOfferTransport,
  joinUiState,
  mapPeekCompact = false,
  titleDetailAccess,
  detailLinkState,
  onBeforeDetailNavigate,
}: MapPeekBodySlotProps) => {
  if (card.source === 'area') {
    return <DestinationPeekBody card={card} />;
  }

  if (card.source === 'activity') {
    return (
      <ActivityPeekBody
        card={card}
        onGuestGatedAction={onGuestGatedAction}
        onOpenLinkedPin={onOpenLinkedPin}
        onOfferTransport={onOfferTransport}
        joinUiState={joinUiState}
        mapPeekCompact={mapPeekCompact}
        titleDetailAccess={titleDetailAccess}
        detailLinkState={detailLinkState}
        onBeforeDetailNavigate={onBeforeDetailNavigate}
      />
    );
  }

  return <CatalogPeekBody card={card} onGuestGatedAction={onGuestGatedAction} mapPeekCompact={mapPeekCompact} />;
};
