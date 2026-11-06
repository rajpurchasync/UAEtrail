import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import {
  discoveryCardPeekShowsDirections,
  discoveryCardShowPeekBodyDirections,
} from '../discovery/discoveryCardModel';
import { PlaceDirectionLinks } from '../components/ui/PlaceDirectionLinks';
import {
  ExploreActivityPeekMeta,
  DiscoveryCardDetailList,
  DiscoveryCardRequirementBadges,
} from '../explore/ui/DiscoveryCardPresentation';

type ActivityDiscoveryPublishedBodyProps = {
  card: DiscoveryCardModel;
  /** Default: map peek rules (`discoveryCardPeekShowsDirections`). */
  showDirections?: boolean;
  /** Map pin bubble — tighter meta and no duplicate direction block. */
  mapPeekCompact?: boolean;
  /** Banner already shows location, time, and price (browse thumbnail layout). */
  mapPeekBrowseLayout?: boolean;
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
  mapPeekCompact = false,
  mapPeekBrowseLayout = false,
}: ActivityDiscoveryPublishedBodyProps) => {
  if (card.source !== 'activity') return null;

  const directions =
    showDirections ?? discoveryCardPeekShowsDirections(card);

  if (mapPeekBrowseLayout) {
    const hasBadges = (card.requirementBadges?.length ?? 0) > 0;
    if (!hasBadges) return null;
    return (
      <div className={mapPeekCompact ? '' : 'mt-2'}>
        <DiscoveryCardRequirementBadges badges={card.requirementBadges!} compact={mapPeekCompact} />
      </div>
    );
  }

  return (
    <>
      <ExploreActivityPeekMeta card={card} compact={mapPeekCompact} />
      <DiscoveryCardDetailList
        details={card.sections.details}
        compact
        mapPeekCompact={mapPeekCompact}
        mapLatitude={card.mapLatitude}
        mapLongitude={card.mapLongitude}
        showDirections={directions}
      />
      {!mapPeekCompact && discoveryCardShowPeekBodyDirections(card) ? (
        <PlaceDirectionLinks
          lat={card.mapLatitude as number}
          lng={card.mapLongitude as number}
          className="mt-3"
        />
      ) : null}
    </>
  );
};
