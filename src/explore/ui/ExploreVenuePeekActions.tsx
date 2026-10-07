import type { ExploreCardModel } from '../exploreCardModel';
import { exploreCardHasMapCoords } from '../exploreCardModel';
import { LIST_FEED_CTA_GET_DIRECTIONS, LIST_FEED_CTA_VIEW_DETAILS } from '../../list/listFeedCtaCopy';
import { ExploreCardDirectionsButton } from './ExploreCardPresentation';
import { ExplorePeekDetailLink } from './ExplorePeekDetailLink';

interface ExploreVenuePeekActionsProps {
  card: ExploreCardModel;
  onClose: () => void;
  /** Guests: sign-up before directions (detail link still gated). */
  onGuestGatedPlanTrip?: () => void;
}

/** Place map peek — Get Directions + View Details (category-aligned). */
export const ExploreVenuePeekActions = ({
  card,
  onClose,
  onGuestGatedPlanTrip,
}: ExploreVenuePeekActionsProps) => {
  const hasCoords = exploreCardHasMapCoords(card);

  return (
    <div className="flex w-full gap-2">
      {hasCoords ? (
        <ExploreCardDirectionsButton
          latitude={card.mapLatitude}
          longitude={card.mapLongitude}
          className="flex min-h-[3.25rem] flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        />
      ) : null}
      <ExplorePeekDetailLink
        card={card}
        label={LIST_FEED_CTA_VIEW_DETAILS}
        className={`flex min-h-[3.25rem] flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-bold text-neutral-800 shadow-sm ${
          hasCoords ? '' : 'w-full'
        }`}
        onGuestGatedAction={onGuestGatedPlanTrip}
        onBeforeNavigate={onClose}
      />
    </div>
  );
};
