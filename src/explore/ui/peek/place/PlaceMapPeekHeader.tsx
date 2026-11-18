import { Footprints, Star } from 'lucide-react';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../../../components/ui/EnvironmentImage';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';
import { placeCoverFallbackClass } from '../../../../place/peek/resolvePlaceRegistryCoverImage';
import type { resolvePlaceMapPeekViewModel } from '../../../../place/resolvePlaceMapPeekViewModel';

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
    <div className="flex gap-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        {vm.coverUrl ? (
          <EnvironmentImage src={vm.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeCoverFallbackClass(card.tone)}`}
            aria-hidden
          >
            <span className="text-3xl">{vm.emoji}</span>
          </div>
        )}
        {vm.thumbBadge ? (
          <span className={EXPLORE_PEEK.venueThumbBadge}>{vm.thumbBadge}</span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {vm.kindLabel ? (
            <span className={EXPLORE_PEEK.venueTypePill}>{vm.kindLabel}</span>
          ) : null}
          {showRating ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-neutral-900">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {vm.averageRating != null && vm.averageRating > 0 ? vm.averageRating.toFixed(1) : '—'}
              {vm.reviewCount > 0 ? (
                <span className="font-medium text-neutral-500">({vm.reviewCount})</span>
              ) : null}
            </span>
          ) : null}
        </div>

        <h2 className={`mt-1 line-clamp-1 ${EXPLORE_PEEK.venueTitle}`}>{vm.title}</h2>

        {vm.metaLine ? (
          <p className={`mt-0.5 line-clamp-1 ${EXPLORE_PEEK.venueMeta}`}>
            <Footprints className="inline h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
            <span className="ml-1">{vm.metaLine}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
};