import type { ExploreCardModel } from '../exploreCardModel';
import { exploreCardHasMapCoords } from '../exploreCardModel';
import { LIST_FEED_CTA_VIEW_DETAILS } from '../../list/listFeedCtaCopy';
import { EXPLORE_PEEK_CTA } from '../../config/exploreTheme';
import { ExploreCardDirectionsButton } from './ExploreCardPresentation';
import { ExplorePeekDetailLink } from './ExplorePeekDetailLink';

interface ExplorePlacePeekActionsProps {
  card: ExploreCardModel;
  onClose: () => void;
  /** Guests: sign-up before directions (detail link still gated). */
  onGuestGatedPlanTrip?: () => void;
}

/** Catalog place map peek — stacked Get directions + View details. */
export const ExplorePlacePeekActions = ({
  card,
  onClose,
  onGuestGatedPlanTrip,
}: ExplorePlacePeekActionsProps) => {
  const hasCoords = exploreCardHasMapCoords(card);

  return (
    <div className="space-y-2">
      {hasCoords ? (
        <ExploreCardDirectionsButton
          latitude={card.mapLatitude}
          longitude={card.mapLongitude}
          showAppPickerAffordance={false}
          showLeadingIcon={false}
          className={EXPLORE_PEEK_CTA.primary}
        />
      ) : null}
      <ExplorePeekDetailLink
        card={card}
        label={LIST_FEED_CTA_VIEW_DETAILS}
        className={EXPLORE_PEEK_CTA.secondary}
        onGuestGatedAction={onGuestGatedPlanTrip}
        onBeforeNavigate={onClose}
      />
    </div>
  );
};
