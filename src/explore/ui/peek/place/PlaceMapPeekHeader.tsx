import { Footprints, Star } from 'lucide-react';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';
import type { resolvePlaceMapPeekViewModel } from '../../../../place/resolvePlaceMapPeekViewModel';
import { MapPeekThumbColumn } from '../shared/MapPeekThumbColumn';

type PlaceMapPeekVm = ReturnType<typeof resolvePlaceMapPeekViewModel>;

export const PlaceMapPeekHeader = ({
  card,
  vm,
}: {
  card: DiscoveryCardModel;
  vm: PlaceMapPeekVm;
}) => {
  const showRating =
    (vm.averageRating != null && vm.averageRating > 0) || (vm.reviewCount != null && vm.reviewCount > 0);

  return (
    <div className="flex gap-3" data-map-peek-media-aside>
      <MapPeekThumbColumn card={card} coverUrl={vm.coverUrl} typeLabel={vm.kindLabel} />

      <div className="min-w-0 flex-1 pt-0.5">
        {showRating ? (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-neutral-900">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {vm.averageRating != null && vm.averageRating > 0 ? vm.averageRating.toFixed(1) : '—'}
            {vm.reviewCount > 0 ? (
              <span className="font-medium text-neutral-500">({vm.reviewCount})</span>
            ) : null}
          </span>
        ) : null}

        <h2 className={`mt-0.5 line-clamp-2 ${EXPLORE_PEEK.venueTitle}`}>{vm.title}</h2>

        {vm.metaLine ? (
          <p className={`mt-0.5 line-clamp-2 ${EXPLORE_PEEK.venueMeta}`}>
            <Footprints className="inline h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
            <span className="ml-1">{vm.metaLine}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
};