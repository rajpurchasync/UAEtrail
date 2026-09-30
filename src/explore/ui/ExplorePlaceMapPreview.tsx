import { Link } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { buildExploreCardModel, exploreCardShowsInlineDirections } from '../exploreCardModel';
import { PlaceCardActions } from '../../components/ui/PlaceCardActions';
import { ExploreMapPeekCard, ExploreMapPeekPosition } from './ExploreMapPeekCard';

interface ExplorePlaceMapPreviewProps {
  item: ExploreMapItemDTO;
  onClose: () => void;
  onGuestGatedAction?: () => void;
}

/** Map pin preview — unified peek card floating above the map. */
export const ExplorePlaceMapPreview = ({ item, onClose, onGuestGatedAction }: ExplorePlaceMapPreviewProps) => {
  const card = buildExploreCardModel(item);
  const accent =
    card.kind === 'camping' ? 'amber' : card.kind === 'event' ? 'violet' : 'emerald';

  const footer = card.reviewPath ? (
    <PlaceCardActions
      detailPath={card.path}
      reviewPath={card.reviewPath}
      accent={accent}
      embedded
      onGuestGatedAction={onGuestGatedAction}
      mapLatitude={card.mapLatitude}
      mapLongitude={card.mapLongitude}
      showGuestDirections={!exploreCardShowsInlineDirections(card)}
    />
  ) : onGuestGatedAction ? (
    <button
      type="button"
      onClick={onGuestGatedAction}
      className="block w-full rounded-2xl bg-emerald-600 py-3 text-center text-sm font-bold text-white"
    >
      {card.primaryCta}
    </button>
  ) : (
    <Link
      to={card.path}
      className="block w-full rounded-2xl bg-emerald-600 py-3 text-center text-sm font-bold text-white"
    >
      {card.primaryCta}
    </Link>
  );

  return (
    <ExploreMapPeekPosition>
      <ExploreMapPeekCard card={card} onClose={onClose} footer={footer} />
    </ExploreMapPeekPosition>
  );
};

/** @deprecated Use ExplorePlaceMapPreview */
export const ExploreLocationMapPreview = ExplorePlaceMapPreview;
