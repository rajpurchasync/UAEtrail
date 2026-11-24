import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../../../components/ui/EnvironmentImage';
import { resolveBrowsePosterCoverUrl, browsePosterFallbackClass } from '../../../../list/browse/browsePosterCover';
import { resolveDiscoveryBrowseListTypeLabel } from '../../../../discovery/browse/resolveDiscoveryBrowseListImageChrome';
import {
  BROWSE_LIST_HERO_TYPE,
  BROWSE_LIST_HERO_TYPE_WRAP,
} from '../../../../discovery/browse/discoveryBrowseListChrome';

export type MapPeekThumbColumnProps = {
  card: DiscoveryCardModel;
  coverUrl?: string | null;
  /** Outing / place kind on the photo only (no emoji badge). */
  typeLabel?: string | null;
  sizeClass?: string;
};

const DEFAULT_SIZE = 'h-20 w-20';

/**
 * Map peek + recommendation rows — left thumb with text kind label (list S1 chrome).
 */
export const MapPeekThumbColumn = ({
  card,
  coverUrl: coverOverride,
  typeLabel: typeOverride,
  sizeClass = DEFAULT_SIZE,
}: MapPeekThumbColumnProps) => {
  const cover = coverOverride ?? resolveBrowsePosterCoverUrl(card);
  const typeLabel =
    typeOverride === undefined ? resolveDiscoveryBrowseListTypeLabel(card) : typeOverride;

  return (
    <div className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-xl bg-neutral-100`}>
      {cover ? (
        <EnvironmentImage
          src={cover}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className={`h-full w-full ${browsePosterFallbackClass(card.tone)}`} aria-hidden />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      {typeLabel ? (
        <span
          className={`absolute left-1 top-1 z-[1] max-w-[calc(100%-0.5rem)] ${BROWSE_LIST_HERO_TYPE_WRAP}`}
        >
          <span className={`line-clamp-2 ${BROWSE_LIST_HERO_TYPE}`}>{typeLabel}</span>
        </span>
      ) : null}
    </div>
  );
};