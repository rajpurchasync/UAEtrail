import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { MapPeekShell, MapPeekActionsSlot, MapPeekBodySlot } from '../map-peek';

export type CatalogPeekCardProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
};

/**
 * Shop, agency, and area pins. Activity outings use `ActivityPeekCard`.
 * Places and facilities use `PlacePeekCard`.
 */
export const CatalogPeekCard = ({ card, onClose, onGuestGatedAction }: CatalogPeekCardProps) => (
  <MapPeekShell
    card={card}
    onClose={onClose}
    onGuestGatedAction={onGuestGatedAction}
    actions={
      <MapPeekActionsSlot
        card={card}
        onClose={onClose}
        onGuestGatedAction={onGuestGatedAction ? () => onGuestGatedAction() : undefined}
      />
    }
  >
    <MapPeekBodySlot card={card} onGuestGatedAction={onGuestGatedAction} mapPeekCompact />
  </MapPeekShell>
);
