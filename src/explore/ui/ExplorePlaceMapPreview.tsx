import { Link } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel } from '../exploreCardModel';
import { PlaceCardActions } from '../../components/ui/PlaceCardActions';
import { ExploreMapPeekCard, ExploreMapPeekPosition } from './ExploreMapPeekCard';

interface ExplorePlaceMapPreviewProps {
  item: ExploreMapItemDTO;
  onClose: () => void;
}

/** Map pin preview — unified peek card floating above the map. */
export const ExplorePlaceMapPreview = ({ item, onClose }: ExplorePlaceMapPreviewProps) => {
  const card = buildExploreCardModel(item);
  const accent =
    card.kind === 'camping' ? 'amber' : card.kind === 'event' ? 'violet' : 'emerald';

  return (
    <ExploreMapPeekPosition>
      <ExploreMapPeekCard
        card={card}
        onClose={onClose}
        footer={
          card.reviewPath ? (
            <PlaceCardActions
              detailPath={card.path}
              reviewPath={card.reviewPath}
              accent={accent}
              embedded
            />
          ) : (
            <Link
              to={card.path}
              className="block w-full rounded-2xl bg-emerald-600 py-3 text-center text-sm font-bold text-white"
            >
              {card.primaryCta}
            </Link>
          )
        }
      />
    </ExploreMapPeekPosition>
  );
};

/** @deprecated Use ExplorePlaceMapPreview */
export const ExploreLocationMapPreview = ExplorePlaceMapPreview;
