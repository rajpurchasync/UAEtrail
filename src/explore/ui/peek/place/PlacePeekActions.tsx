import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { exploreCardHasMapCoords } from '../../../discovery/discoveryCardModel';
import { LIST_FEED_CTA_VIEW_DETAILS } from '../../../list/listFeedCtaCopy';
import { EXPLORE_PEEK_CTA } from '../../../config/exploreTheme';
import { ExploreCardDirectionsButton } from '../ExploreCardPresentation';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';

/** Catalog **Place** pin (`card.source === 'venue'` on explore wire). */
export type PlacePeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedPlanTrip?: () => void;
};

/** Catalog place pin summary — directions + view details. */
export const PlacePeekActions = ({
  card,
  onClose,
  onGuestGatedPlanTrip,
}: PlacePeekActionsProps) => {
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
      <PeekDetailLink
        card={card}
        label={LIST_FEED_CTA_VIEW_DETAILS}
        className={EXPLORE_PEEK_CTA.secondary}
        onGuestGatedAction={onGuestGatedPlanTrip}
        onBeforeNavigate={onClose}
      />
    </div>
  );
};
