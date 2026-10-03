import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel } from '../exploreCardModel';
import { ExploreMapPeekCard, ExploreMapPeekPosition } from './ExploreMapPeekCard';
import { ExploreVenuePeekFooter } from './ExploreVenuePeekFooter';

interface ExplorePlaceMapPreviewProps {
  item: ExploreMapItemDTO;
  onClose: () => void;
  onPlanTrip: (item: ExploreMapItemDTO) => void;
  onGuestGatedAction?: () => void;
}

/** Map pin preview — unified peek card floating above the map. */
export const ExplorePlaceMapPreview = ({
  item,
  onClose,
  onPlanTrip,
  onGuestGatedAction,
}: ExplorePlaceMapPreviewProps) => {
  const card = buildExploreCardModel(item);

  const footer = (
    <ExploreVenuePeekFooter
      card={card}
      onPlanTrip={() => onPlanTrip(item)}
      onGuestGatedPlanTrip={onGuestGatedAction}
    />
  );

  return (
    <ExploreMapPeekPosition>
      <ExploreMapPeekCard card={card} onClose={onClose} footer={footer} />
    </ExploreMapPeekPosition>
  );
};

/** @deprecated Use ExplorePlaceMapPreview */
export const ExploreLocationMapPreview = ExplorePlaceMapPreview;
