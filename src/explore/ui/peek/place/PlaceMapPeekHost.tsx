import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../../../discovery';
import { MapPeekOverlay } from '../../map-peek';
import { PlacePeekCard } from '../PlacePeekCard';

type PlaceMapPeekHostProps = {
  item: ExploreMapItemDTO;
  onClose: () => void;
  onGuestGatedAction?: () => void;
};

/**
 * **Mount** for {@link PlacePeekCard} on the map — not an activity organizer (“host”).
 * Wire `source: 'venue'` = catalog **Place** on the Spots lens.
 */
export const PlaceMapPeekHost = ({
  item,
  onClose,
  onGuestGatedAction,
}: PlaceMapPeekHostProps) => {
  const card = buildDiscoveryCardViewModelCard(item);

  return (
    <MapPeekOverlay onClose={onClose}>
      <PlacePeekCard card={card} onClose={onClose} onGuestGatedAction={onGuestGatedAction} />
    </MapPeekOverlay>
  );
};
