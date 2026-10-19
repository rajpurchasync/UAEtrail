import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  discoveryCardPeekShowsDirections,
  discoveryCardShowPeekBodyDirections,
} from '../discovery/discoveryCardModel';
import { PlaceDirectionLinks } from '../components/ui/PlaceDirectionLinks';
import {
  ExploreActivityPeekMeta,
  DiscoveryCardDetailList,
} from '../explore/ui/DiscoveryCardPresentation';

type ActivityDiscoveryPublishedBodyProps = {
  card: DiscoveryCardModel;
  /** Default: map peek rules (`discoveryCardPeekShowsDirections`). */
  showDirections?: boolean;
};

/**
 * Published activity readout for discovery layouts (map peek, browse card, `/activity/:id`).
 *
 * Input: organizer fields on the activity row → API map/detail wire →
 * `buildDiscoveryCardPresentation` → `buildDiscoveryCardViewModelCard` → `card`.
 * Do not add parallel fact resolvers here.
 */
export const ActivityDiscoveryPublishedBody = ({
  card,
  showDirections,
}: ActivityDiscoveryPublishedBodyProps) => {
  if (card.source !== 'activity') return null;

  const directions =
    showDirections ?? discoveryCardPeekShowsDirections(card);

  return (
    <>
      <ExploreActivityPeekMeta card={card} />
      <DiscoveryCardDetailList
        details={card.sections.details}
        compact
        mapLatitude={card.mapLatitude}
        mapLongitude={card.mapLongitude}
        showDirections={directions}
      />
      {discoveryCardShowPeekBodyDirections(card) ? (
        <PlaceDirectionLinks
          lat={card.mapLatitude as number}
          lng={card.mapLongitude as number}
          className="mt-3"
        />
      ) : null}
    </>
  );
};
