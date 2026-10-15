import type { ActivityMapPeekActionId } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../../../utils/joinRequestUi';
import { ActivityPeekActions } from '../peek/activity/ActivityPeekActions';
import { ActivityPeekBody } from '../peek/activity/ActivityPeekBody';
import { AreaPeekActions } from '../peek/area/AreaPeekActions';
import { AreaPeekBody } from '../peek/area/AreaPeekBody';
import { CatalogPeekBody } from '../peek/catalog/CatalogPeekBody';
import { ShopPeekActions } from '../peek/shop/ShopPeekActions';

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
  onGuestGatedAction?: () => void;
};

export const MapPeekActionsSlot = ({
  card,
  onClose,
  ...rest
}: MapPeekActionsSlotProps) => {
  if (card.source === 'area' && card.areaSlug) {
    return (
      <AreaPeekActions
        areaSlug={card.areaSlug}
        stats={card.areaLensStats}
        areaPagePath={card.path}
        onClose={onClose}
      />
    );
  }

  if (card.source === 'shop') {
    const externalUrl = card.websiteUrl?.trim() || null;
    return (
      <ShopPeekActions
        card={card}
        onClose={onClose}
        onGuestGatedAction={rest.onGuestGatedAction}
        externalUrl={externalUrl}
      />
    );
  }

  return <ActivityPeekActions card={card} onClose={onClose} {...rest} />;
};

export type MapPeekBodySlotProps = {
  card: DiscoveryCardModel;
  onGuestGatedAction?: () => void;
  onOpenLinkedPin?: (exploreItemId: string) => void;
  onOfferTransport?: () => void;
  joinUiState?: JoinRequestUiState;
};

export const MapPeekBodySlot = ({
  card,
  onGuestGatedAction,
  onOpenLinkedPin,
  onOfferTransport,
  joinUiState,
}: MapPeekBodySlotProps) => {
  if (card.source === 'area') {
    return <AreaPeekBody card={card} />;
  }

  if (card.source === 'activity') {
    return (
      <ActivityPeekBody
        card={card}
        onGuestGatedAction={onGuestGatedAction}
        onOpenLinkedPin={onOpenLinkedPin}
        onOfferTransport={onOfferTransport}
        joinUiState={joinUiState}
      />
    );
  }

  return <CatalogPeekBody card={card} onGuestGatedAction={onGuestGatedAction} />;
};
