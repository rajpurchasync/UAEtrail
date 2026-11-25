import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import type { ViewerFix } from '../../../../discovery/discoverySession';
import { resolvePlaceMapPeekViewModel } from '../../../../place/resolvePlaceMapPeekViewModel';
import { PlaceMapPeekHeader } from './PlaceMapPeekHeader';
import { PlaceMapPeekAmenityChips } from './PlaceMapPeekAmenityChips';
import { PlaceMapPeekScheduledRow } from './PlaceMapPeekScheduledRow';

/** Reference venue map peek — thumb + type/title/meta, chips, scheduled outings. */
export const PlaceMapPeekCompactLayout = ({
  card,
  viewer,
  onBeforeDetailNavigate,
}: {
  card: DiscoveryCardModel;
  viewer?: ViewerFix | null;
  onBeforeDetailNavigate?: () => void;
}) => {
  const vm = resolvePlaceMapPeekViewModel(card, viewer);

  return (
    <div className="space-y-2.5" data-place-map-peek-layout>
      <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-neutral-200 md:hidden" aria-hidden />
      <PlaceMapPeekHeader card={card} vm={vm} />
      <PlaceMapPeekAmenityChips labels={vm.amenityChips} />
      <PlaceMapPeekScheduledRow
        locationId={vm.locationId}
        detailPath={vm.detailPath}
        onNavigate={onBeforeDetailNavigate}
      />
    </div>
  );
};