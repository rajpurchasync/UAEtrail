import type { ExploreCardModel } from '../explore/exploreCardModel';
import {
  exploreCardPeekShowsDirections,
  exploreCardShowPeekBodyDirections,
} from '../explore/exploreCardModel';
import { PlaceDirectionLinks } from '../components/ui/PlaceDirectionLinks';
import {
  ExploreActivityPeekMeta,
  ExploreCardDetailList,
} from '../explore/ui/ExploreCardPresentation';

type ActivityDiscoveryPublishedBodyProps = {
  card: ExploreCardModel;
  /** Default: map peek rules (`exploreCardPeekShowsDirections`). */
  showDirections?: boolean;
};

/**
 * Published activity readout for discovery layouts (map peek, browse card, `/activity/:id`).
 *
 * Input: organizer fields on the activity row → API map/detail wire →
 * `buildExploreCardPresentation` → `buildDiscoveryCardViewModelCard` → `card`.
 * Do not add parallel fact resolvers here.
 */
export const ActivityDiscoveryPublishedBody = ({
  card,
  showDirections,
}: ActivityDiscoveryPublishedBodyProps) => {
  if (card.source !== 'activity') return null;

  const directions =
    showDirections ?? exploreCardPeekShowsDirections(card);

  return (
    <>
      <ExploreActivityPeekMeta card={card} />
      <ExploreCardDetailList
        details={card.sections.details}
        compact
        mapLatitude={card.mapLatitude}
        mapLongitude={card.mapLongitude}
        showDirections={directions}
      />
      {exploreCardShowPeekBodyDirections(card) ? (
        <PlaceDirectionLinks
          lat={card.mapLatitude as number}
          lng={card.mapLongitude as number}
          className="mt-3"
        />
      ) : null}
    </>
  );
};
