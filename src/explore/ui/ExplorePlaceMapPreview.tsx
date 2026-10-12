import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery/discoveryCardViewModel';
import { ExploreMapPeekCard, ExploreMapPeekPosition } from './ExploreMapPeekCard';
import { ExploreVenuePeekActions } from './ExploreVenuePeekActions';

interface ExplorePlaceMapPreviewProps {
  item: ExploreMapItemDTO;
  onClose: () => void;
  onGuestGatedAction?: () => void;
}

/** Map pin preview — unified peek card floating above the map. */
export const ExplorePlaceMapPreview = ({
  item,
  onClose,
  onGuestGatedAction,
}: ExplorePlaceMapPreviewProps) => {
  const card = buildDiscoveryCardViewModelCard(item);

  const actions = (
    <ExploreVenuePeekActions
      card={card}
      onClose={onClose}
      onGuestGatedPlanTrip={onGuestGatedAction}
    />
  );

  return (
    <ExploreMapPeekPosition onClose={onClose}>
      <ExploreMapPeekCard card={card} onClose={onClose} actions={actions} />
    </ExploreMapPeekPosition>
  );
};

/** @deprecated Use ExplorePlaceMapPreview */
export const ExploreLocationMapPreview = ExplorePlaceMapPreview;
