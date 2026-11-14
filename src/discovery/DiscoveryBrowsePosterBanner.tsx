import type { ReactNode } from 'react';
import { Clock, MapPin } from 'lucide-react';
import type { DiscoveryCardModel } from './discoveryCardModel';
import { EnvironmentImage } from '../components/ui/EnvironmentImage';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { DiscoveryCardTypeIcon } from '../explore/ui/DiscoveryCardTypeIcon';
import { resolveBrowsePosterCoverUrl, browsePosterFallbackClass } from '../list/browsePosterCover';
import { browseCardMeta } from '../list/browse/browseCardMeta';
import { DiscoveryCardHostProfileNav } from './DiscoveryCardHostProfileNav';

export type DiscoveryBrowsePosterBannerProps = {
  card: DiscoveryCardModel;
  /** Image block height — list thumbs vs map peek differ. */
  imageHeightClass?: string;
  /** Peek chrome (close, share) — top-right; host aligns right, vertically mid CTA↔price. */
  headerActions?: ReactNode;
  /** Wishlist / follow — beside type icon (top-left). */
  leadingActions?: ReactNode;
  /** List thumbnail hover zoom on cover image. */
  imageHoverZoom?: boolean;
  /** Place name on the photo (legacy venue overlay) — trip cards keep the title below. */
  overlayTitle?: string | null;
  /** Emoji without the colored circle. */
  typeIconBare?: boolean;
  /** Venue listing puts title/location in the body — photo is chrome only. */
  showOverlayMeta?: boolean;
  /** Catalogue overlay (emirate · hub, rating, trips) — replaces trip when/price. */
  overlayContent?: ReactNode;
  /** Trip listing puts host in the body — hide the photo band. */
  hideHostBand?: boolean;
  /** Map peek — sign-in before opening host profile. */
  onGuestGatedAction?: () => void;
  onBeforeNavigate?: () => void;
  /** Banner sits inside a list item link — host chip uses button navigation. */
  embedHostInItemLink?: boolean;
};

const DEFAULT_IMAGE_HEIGHT =
  'h-[9.75rem] w-full shrink-0 sm:h-[8.75rem] md:h-32 lg:h-[7.25rem]';

/** Shared poster hero — map peek + browse thumbnail layouts (L1 discovery chrome). */
export const DiscoveryBrowsePosterBanner = ({
  card,
  imageHeightClass = DEFAULT_IMAGE_HEIGHT,
  headerActions = null,
  leadingActions = null,
  imageHoverZoom = false,
  overlayTitle = null,
  typeIconBare = false,
  showOverlayMeta = true,
  overlayContent = null,
  hideHostBand = false,
  onGuestGatedAction,
  onBeforeNavigate,
  embedHostInItemLink = false,
}: DiscoveryBrowsePosterBannerProps) => {
  const cover = resolveBrowsePosterCoverUrl(card);
  const meta = browseCardMeta(card);
  const showBottom = overlayContent
    ? true
    : showOverlayMeta && Boolean(overlayTitle || meta.location || meta.when || meta.price);
  /** Bottom of peek share/close row (top-2.5 + h-8 controls). */
  const PEEK_CTA_BOTTOM = 'top-[calc(0.625rem+2rem)]';
  /** Top of price chip (pb-1.5 + chip height) — not the gradient’s pt-8 padding. */
  const PEEK_PRICE_TOP = 'bottom-[calc(0.375rem+1.125rem)]';
  /** When there is no price pill, end the band at the meta row (pb + ~one line). */
  const PEEK_META_ROW_TOP = 'bottom-[calc(0.375rem+1.75rem)]';

  const showHostBand = !hideHostBand && Boolean(meta.hostName || meta.soldOut);
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
          bare={typeIconBare}
          className={
            typeIconBare
              ? 'shrink-0'
              : 'h-5 w-5 shrink-0 text-xs shadow-sm ring-2 ring-white/90 md:h-[1.125rem] md:w-[1.125rem]'
          }
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
            <DiscoveryCardHostProfileNav
              card={card}
              embedInItemLink={embedHostInItemLink}
              onGuestGatedAction={onGuestGatedAction}
              onBeforeNavigate={onBeforeNavigate}
              ariaLabel={`View ${meta.hostName} profile`}
              className="flex max-w-full items-center gap-1 rounded-full bg-black/55 py-0.5 pl-0.5 pr-1.5 shadow-sm ring-1 ring-white/15 transition-colors hover:bg-black/70"
            >
              <SecureAvatar
                src={meta.hostAvatar}
                name={meta.hostName}
                className="h-5 w-5 shrink-0 text-[8px] ring-1 ring-white/80"
              />
              <span className="min-w-0 truncate text-[10px] font-semibold leading-none text-white">
                {meta.hostName}
              </span>
            </DiscoveryCardHostProfileNav>
          ) : null}
          {meta.soldOut ? (
            <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Sold out
            </span>
          ) : null}
        </div>
      ) : null}
      {showBottom ? (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2.5 pb-2 ${
            overlayTitle ? 'pt-12' : overlayContent ? 'pt-10' : 'pt-8'
          }`}
        >
          {overlayContent ? (
            overlayContent
          ) : (
          <div className="flex items-end gap-1.5">
            <div className="min-w-0 flex-1">
              {overlayTitle ? (
                <p className="line-clamp-2 text-[15px] font-bold leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,.55)]">
                  {overlayTitle}
                </p>
              ) : null}
              {meta.location ? (
                <p
                  className={`flex flex-wrap items-center gap-1 text-[10px] font-semibold leading-tight text-white ${
                    overlayTitle ? 'mt-0.5 text-white/90' : ''
                  }`}
                >
                  {meta.location ? (
                    <>
                      <MapPin className="h-3 w-3 shrink-0 text-emerald-300" aria-hidden />
                      <span className="min-w-0 line-clamp-2">{meta.location}</span>
                    </>
                  ) : null}
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
          )}
        </div>
      ) : null}
    </div>
  );
};