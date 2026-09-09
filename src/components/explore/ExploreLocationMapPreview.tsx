import { Link } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel } from '../../explore/exploreCardModel';
import { LocationCardActions } from '../ui/LocationCardActions';
import { ExploreMapPeekCard, ExploreMapPeekPosition } from './ExploreMapPeekCard';

interface ExploreLocationMapPreviewProps {
  item: ExploreMapItemDTO;
  onClose: () => void;
  onFocusMapLocation?: (coords: { lat: number; lng: number }) => void;
}

/** Map pin preview — unified peek card floating above the map. */
export const ExploreLocationMapPreview = ({ item, onClose, onFocusMapLocation }: ExploreLocationMapPreviewProps) => {
  const card = buildExploreCardModel(item);
  const accent =
    card.kind === 'camping' ? 'amber' : card.kind === 'event' ? 'violet' : 'emerald';

  return (
    <ExploreMapPeekPosition>
      <ExploreMapPeekCard
        card={card}
        onClose={onClose}
        onFocusMapLocation={onFocusMapLocation}
        footer={
          card.reviewPath ? (
            <LocationCardActions
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
