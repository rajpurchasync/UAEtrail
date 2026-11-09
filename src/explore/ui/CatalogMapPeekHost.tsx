import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import type { MapPeekPinAnchor } from '../mapPeekBubbleLayout';
import { MapPeekOverlay } from './map-peek';
import { CatalogPeekCard } from './peek/CatalogPeekCard';

export type CatalogMapPeekHostProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  pinAnchor?: MapPeekPinAnchor | null;
  pinKey?: string | null;
};

/** Mount for shop, agency, and area pins. Activity outings use `ActivityMapPeekHost`. */
export const CatalogMapPeekHost = ({
  card,
  onClose,
  onGuestGatedAction,
  pinAnchor = null,
  pinKey = null,
}: CatalogMapPeekHostProps) => (
  <MapPeekOverlay onClose={onClose} pinAnchor={pinAnchor} pinKey={pinKey}>
    <CatalogPeekCard card={card} onClose={onClose} onGuestGatedAction={onGuestGatedAction} />
  </MapPeekOverlay>
);
