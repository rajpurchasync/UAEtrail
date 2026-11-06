import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../../../discovery';
import type { MapPeekPinAnchor } from '../../../mapPeekBubbleLayout';
import { MapPeekOverlay } from '../../map-peek';
import { PlacePeekCard } from '../PlacePeekCard';

type PlaceMapPeekHostProps = {
  item: ExploreMapItemDTO;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  pinAnchor?: MapPeekPinAnchor | null;
  pinKey?: string | null;
};

/**
 * **Mount** for {@link PlacePeekCard} on the map — not an activity organizer (“host”).
 * Wire `source: place` (and `facility` until a dedicated peek) on the map.
 */
export const PlaceMapPeekHost = ({
  item,
  onClose,
  onGuestGatedAction,
  pinAnchor = null,
  pinKey = null,
}: PlaceMapPeekHostProps) => {
  const card = buildDiscoveryCardViewModelCard(item);

  return (
    <MapPeekOverlay onClose={onClose} pinAnchor={pinAnchor} pinKey={pinKey}>
      <PlacePeekCard card={card} onClose={onClose} onGuestGatedAction={onGuestGatedAction} />
    </MapPeekOverlay>
  );
};
