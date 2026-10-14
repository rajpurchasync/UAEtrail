import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import { ExploreMapPeekCard, ExploreMapPeekPosition } from './ExploreMapPeekCard';
import { ExplorePlacePeekActions } from './ExplorePlacePeekActions';

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
    <ExplorePlacePeekActions
      card={card}
      onClose={onClose}
      onGuestGatedPlanTrip={onGuestGatedAction}
    />
  );

  return (
    <ExploreMapPeekPosition onClose={onClose}>
      <ExploreMapPeekCard
        card={card}
        onClose={onClose}
        actions={actions}
        placePeekLayout
        onGuestGatedAction={onGuestGatedAction}
      />
    </ExploreMapPeekPosition>
  );
};

/** @deprecated Use ExplorePlaceMapPreview */
export const ExploreLocationMapPreview = ExplorePlaceMapPreview;
