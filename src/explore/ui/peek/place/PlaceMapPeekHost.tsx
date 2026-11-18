import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../../../discovery';
import type { ViewerFix } from '../../../../list/explorer/placeDistance';
import type { MapPeekPinAnchor } from '../../../mapPeekBubbleLayout';
import { MapPeekOverlay } from '../../map-peek';
import { PlacePeekCard } from '../PlacePeekCard';

type PlaceMapPeekHostProps = {
  item: ExploreMapItemDTO;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  pinAnchor?: MapPeekPinAnchor | null;
  pinKey?: string | null;
  viewer?: ViewerFix | null;
};

/**
 * **Mount** for {@link PlacePeekCard} on the map — not an activity organizer (“host”).
 * Place pins plan a trip. Facility pins use the same shell with directions and the facility page.
 */
export const PlaceMapPeekHost = ({
  item,
  onClose,
  onGuestGatedAction,
  pinAnchor = null,
  pinKey = null,
  viewer = null,
}: PlaceMapPeekHostProps) => {
  const card = buildDiscoveryCardViewModelCard(item);

  return (
    <MapPeekOverlay onClose={onClose} pinAnchor={pinAnchor} pinKey={pinKey}>
      <PlacePeekCard card={card} onClose={onClose} onGuestGatedAction={onGuestGatedAction} viewer={viewer} />
    </MapPeekOverlay>
  );
};
