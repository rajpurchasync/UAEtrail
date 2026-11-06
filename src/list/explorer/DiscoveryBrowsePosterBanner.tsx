import type { ReactNode } from 'react';
import { Clock, MapPin } from 'lucide-react';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { DiscoveryCardTypeIcon } from '../../explore/ui/DiscoveryCardTypeIcon';
import { resolveBrowsePosterCoverUrl, browsePosterFallbackClass } from '../browsePosterCover';
import { listExplorerCardMeta } from './listExplorerCardMeta';
import { usePlaceDistanceLabel } from './listPlaceDistance';
import { ListExplorerDistanceChip } from './ListExplorerDistanceChip';

export type DiscoveryBrowsePosterBannerProps = {
  card: DiscoveryCardModel;
  /** Image block height — list thumbs vs map peek differ. */
  imageHeightClass?: string;
  showDistance?: boolean;
  /** Peek chrome (close, share) — top-right; host aligns right, vertically mid CTA↔price. */
  headerActions?: ReactNode;
  /** Wishlist / follow — beside type icon (top-left). */
  leadingActions?: ReactNode;
  /** List thumbnail hover zoom on cover image. */
  imageHoverZoom?: boolean;
};

const DEFAULT_IMAGE_HEIGHT =
  'h-[9.75rem] w-full shrink-0 sm:h-[8.75rem] md:h-32 lg:h-[7.25rem]';

/** Shared poster hero — list thumbnails and map pin summary banner. */
export const DiscoveryBrowsePosterBanner = ({
  card,
  imageHeightClass = DEFAULT_IMAGE_HEIGHT,
  showDistance = false,
  headerActions = null,
  leadingActions = null,
  imageHoverZoom = false,
}: DiscoveryBrowsePosterBannerProps) => {
  const cover = resolveBrowsePosterCoverUrl(card);
  const meta = listExplorerCardMeta(card);
  const distance = usePlaceDistanceLabel(card.mapLatitude, card.mapLongitude);
  const showBottom = Boolean(
    meta.location || meta.when || meta.price || distance || (showDistance && distance)
  );
  /** Bottom of peek share/close row (top-2.5 + h-8 controls). */
  const PEEK_CTA_BOTTOM = 'top-[calc(0.625rem+2rem)]';
  /** Top of price chip (pb-1.5 + chip height) — not the gradient’s pt-8 padding. */
  const PEEK_PRICE_TOP = 'bottom-[calc(0.375rem+1.125rem)]';
  /** When there is no price pill, end the band at the meta row (pb + ~one line). */
  const PEEK_META_ROW_TOP = 'bottom-[calc(0.375rem+1.75rem)]';

  const showHostBand = Boolean(meta.hostName || meta.soldOut);
  const hostAnchorTop = headerActions ? PEEK_CTA_BOTTOM : 'top-9';
  const hostAnchorBottom = showBottom
    ? meta.price
      ? PEEK_PRICE_TOP
      : PEEK_META_ROW_TOP
    : 'bottom-2.5';

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${imageHeightClass}`}>
      {cover ? (
        <EnvironmentImage
          src={cover}
          catalogThumb
          alt=""
          className={`h-full w-full object-cover object-center${
            imageHoverZoom ? ' transition duration-300 group-hover:scale-[1.03]' : ''
          }`}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className={`h-full w-full ${browsePosterFallbackClass(card.tone)}`}
          aria-hidden
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
      <div className="pointer-events-auto absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5">
        <DiscoveryCardTypeIcon
          tone={card.tone}
          source={card.source}
          kind={card.kind}
          emoji={card.emoji}
          size="overlay"
          className="h-5 w-5 shrink-0 text-xs shadow-sm ring-2 ring-white/90 md:h-[1.125rem] md:w-[1.125rem]"
        />
        {leadingActions}
      </div>
      {headerActions ? (
        <div className="pointer-events-auto absolute right-2 top-2.5 z-20 flex items-center justify-end gap-1">
          {headerActions}
        </div>
      ) : null}
      {showHostBand ? (
        <div
          className={`pointer-events-auto absolute right-2 z-10 flex max-w-[min(78%,13rem)] flex-col items-end justify-center gap-1 ${hostAnchorTop} ${hostAnchorBottom}`}
        >
          {meta.hostName ? (
            <div className="flex max-w-full items-center gap-1 rounded-full bg-black/55 py-0.5 pl-0.5 pr-1.5 shadow-sm ring-1 ring-white/15">
              <SecureAvatar
                src={meta.hostAvatar}
                name={meta.hostName}
                className="h-5 w-5 shrink-0 text-[8px] ring-1 ring-white/80"
              />
              <span className="min-w-0 truncate text-[10px] font-semibold leading-none text-white">
                {meta.hostName}
              </span>
            </div>
          ) : null}
          {meta.soldOut ? (
            <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Sold out
            </span>
          ) : null}
        </div>
      ) : null}
      {showBottom ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2 pb-1.5 pt-8">
          <div className="flex items-end gap-1.5">
            <div className="min-w-0 flex-1">
              {meta.location || distance ? (
                <p className="flex flex-wrap items-center gap-1 text-[10px] font-semibold leading-tight text-white">
                  {meta.location ? (
                    <>
                      <MapPin className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden />
                      <span className="min-w-0 line-clamp-2">{meta.location}</span>
                    </>
                  ) : null}
                  {distance ? <ListExplorerDistanceChip label={distance} variant="dark" /> : null}
                </p>
              ) : null}
              {meta.when ? (
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium leading-tight text-white/90">
                  <Clock className="h-3 w-3 shrink-0 text-white/80" aria-hidden />
                  <span className="truncate">{meta.when}</span>
                </p>
              ) : null}
            </div>
            {meta.price ? (
              <span className="shrink-0 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold leading-none text-neutral-900 shadow-sm">
                {meta.price}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
