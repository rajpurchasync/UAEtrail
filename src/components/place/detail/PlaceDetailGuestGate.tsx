import { ExploreGuestSignInCard } from '@/discovery/discoveryPortExploreGuest';
import { canonicalPlaceDetailPath } from '../../../config/routingCatalog';

type PlaceDetailGuestGateProps = {
  placeId: string;
  placeName: string;
  compact?: boolean;
  className?: string;
};

/** Guest `/place/:id` — preview framing; full trail/camp detail requires sign-in. */
export const PlaceDetailGuestGate = ({
  placeId,
  placeName,
  compact = false,
  className = '',
}: PlaceDetailGuestGateProps) => (
  <ExploreGuestSignInCard
    intent="place-detail"
    activityTitle={placeName}
    authReturnPath={canonicalPlaceDetailPath(placeId)}
    compact={compact}
    className={className}
  />
);
