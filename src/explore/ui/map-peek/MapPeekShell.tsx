import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { Share2, X } from 'lucide-react';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { EXPLORE_PEEK } from '../../../config/exploreTheme';
import { layoutMapPeekBubble, mapPeekFitScale, type MapPeekPinAnchor } from '../../mapPeekBubbleLayout';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { ShareButton } from '../../../components/ui/ShareButton';
import { ExploreFollowButton } from '../ExploreFollowButton';
import { ExploreWishlistSaveButton } from '../ExploreWishlistSaveButton';
import { discoveryCardPeekShowsFollow } from '../../../discovery/discoveryCardModel';
import {
  DiscoveryCardHeadline,
  DiscoveryCardRatingRow,
  DiscoveryCardTypeBadge,
  ExploreVenueImageBadges,
} from '../DiscoveryCardPresentation';
import { ActivityDiscoveryPublishedBody } from '../../../discovery/ActivityDiscoveryPublishedBody';
import { DiscoveryBrowsePosterBanner } from '../../../discovery/DiscoveryBrowsePosterBanner';
import { DiscoveryBrowseCardMetaSlot } from '../../../discovery/browse/DiscoveryBrowseCardMetaSlot';
import { resolveTripBrowseCardCopy } from '../../../list/browse/tripBrowseCardCopy';
import { MapPeekBrowseTitle } from './MapPeekBrowseTitle';
import { PlacePeekBody } from '../peek/place/PlacePeekBody';
import { PlacePeekHero } from '../peek/place/PlacePeekHero';
import { activityPeekHasMapWireActions } from '../../../activity/activityPeekEngagement';
import { resolvePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';
import { mapPeekDetailNavState } from '../../mapPeekDetailNavState';
import { UiTooltip } from '../../../components/ui/UiTooltip';
import { shareSurfaceFromDiscoveryCard } from '../../../content/shareSheetCopy';

export type MapPeekShellProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  /** Summary card CTA block (wire actions or join flow — not a full-page footer). */
  actions: ReactNode;
  children?: ReactNode;
  joinStateLoading?: boolean;
  onGuestGatedAction?: () => void;
  /** Inline rail / list — compact card chrome (dismiss hidden unless `showDismissChrome`). */
  embedMode?: boolean;
  /** When set, overrides default dismiss visibility (`!embedMode`). */
  showDismissChrome?: boolean;
  statusBanner?: string | null;
  /** Catalog place pins (`source: venue`) — hero + kind facts via `PlacePeekCard`. */
  catalogPlaceSummary?: boolean;
  /** Activity pins — opens canonical outing share sheet (in-app + external). */
  onShareActivity?: () => void;
};

/** Shared chrome for map/list pin summaries (activities, places, shops). */
export const MapPeekShell = ({
  card,
  onClose,
  actions,
  children,
  joinStateLoading = false,
  onGuestGatedAction,
  embedMode = false,
  showDismissChrome,
  statusBanner = null,
  catalogPlaceSummary = false,
  onShareActivity,
}: MapPeekShellProps) => {
  const dismissVisible = showDismissChrome ?? !embedMode;
  const mapSummary = !embedMode;
  const location = useLocation();
  const titleDetailAccess = resolvePeekDetailAccess(card, {
    isGuest: Boolean(onGuestGatedAction),
    joinStateLoading: activityPeekHasMapWireActions(card) ? false : joinStateLoading,
  });
  const detailLinkState = mapPeekDetailNavState(location);
  const shellClass = embedMode
    ? 'overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)] ring-1 ring-black/5'
    : EXPLORE_PEEK.shell;
  const browseBannerPeek = mapSummary && !catalogPlaceSummary;
  const showCoverHero =
    !browseBannerPeek && Boolean(card.coverImage) && !catalogPlaceSummary;
  const showPlaceCatalogHero = catalogPlaceSummary && isGeographyMapSource(card.source);
  const peekBannerIconBtn = EXPLORE_PEEK.mediaIconBtn;
  const shareIconButtonClass = browseBannerPeek
    ? peekBannerIconBtn
    : showCoverHero
      ? peekBannerIconBtn
      : 'inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200/90 hover:bg-neutral-50 transition-colors';

  const peekLeadingActions =
    isGeographyMapSource(card.source) ? (
      <ExploreWishlistSaveButton card={card} />
    ) : discoveryCardPeekShowsFollow(card) ? (
      <ExploreFollowButton card={card} />
    ) : null;

  const activityBrowseCopy =
    browseBannerPeek && card.source === 'activity' ? resolveTripBrowseCardCopy(card) : null;

  const peekHeaderActions = (
    <>
      {onShareActivity ? (
        <UiTooltip label="Share">
          <button
            type="button"
            aria-label="Share"
            className={shareIconButtonClass}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShareActivity();
            }}
          >
            <Share2 className="h-4 w-4" aria-hidden />
          </button>
        </UiTooltip>
      ) : card.sharePath ? (
        <ShareButton
          title={card.shareTitle}
          text={card.shareText ?? undefined}
          path={card.sharePath}
          shareSurface={shareSurfaceFromDiscoveryCard(card)}
          iconOnly
          light={false}
        />
      ) : null}
      {dismissVisible ? (
        <UiTooltip label="Close">
          <button
            type="button"
            onClick={onClose}
            className={browseBannerPeek || showCoverHero ? peekBannerIconBtn : 'flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-gray-700'}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </UiTooltip>
      ) : null}
    </>
  );

  return (
    <div className={shellClass} data-pin-summary="card">
      {showPlaceCatalogHero ? (
        <PlacePeekHero
          card={card}
          embedMode={embedMode}
          onClose={onClose}
          onBeforeDetailNavigate={onClose}
        />
      ) : null}
      {browseBannerPeek ? (
        <DiscoveryBrowsePosterBanner
          card={card}
          imageHeightClass="aspect-[3/2] w-full shrink-0"
          showOverlayMeta={false}
          hideHostBand
          leadingActions={peekLeadingActions}
          headerActions={peekHeaderActions}
          onGuestGatedAction={onGuestGatedAction}
          onBeforeNavigate={onClose}
        />
      ) : null}
      {showCoverHero ? (
        <div
          className={`relative w-full shrink-0 overflow-hidden bg-neutral-100${
            embedMode ? ' aspect-[2/1]' : mapSummary ? ' h-28' : ' h-36'
          }`}
        >
          <EnvironmentImage
            src={card.coverImage ?? undefined}
            catalogThumb
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          <ExploreVenueImageBadges card={card} />
          {dismissVisible ? (
            <UiTooltip label="Close">
            <button
              type="button"
              onClick={onClose}
              className={`absolute right-3 top-3 ${EXPLORE_PEEK.mediaIconBtn}`}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            </UiTooltip>
          ) : null}
        </div>
      ) : null}

      {!showPlaceCatalogHero && !browseBannerPeek ? (
        <div
          className={`flex shrink-0 items-start justify-between gap-2 ${
            mapSummary ? 'px-3' : 'px-4'
          } ${showCoverHero ? (mapSummary ? 'pt-2' : 'pt-3') : mapSummary ? 'pt-2.5' : 'pt-4'}`}
        >
          <DiscoveryCardTypeBadge card={card} size="sm" />
          <div className="flex shrink-0 items-start gap-1.5">
            {isGeographyMapSource(card.source) ? (
              <ExploreWishlistSaveButton card={card} light={!showCoverHero} />
            ) : discoveryCardPeekShowsFollow(card) ? (
              <ExploreFollowButton card={card} light={!showCoverHero} />
            ) : null}
            {onShareActivity ? (
              <UiTooltip label="Share">
                <button
                  type="button"
                  aria-label="Share"
                  className={shareIconButtonClass}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShareActivity();
                  }}
                >
                  <Share2 className="h-4 w-4" aria-hidden />
                </button>
              </UiTooltip>
            ) : card.sharePath ? (
              <ShareButton
                title={card.shareTitle}
                text={card.shareText ?? undefined}
                path={card.sharePath}
                shareSurface={shareSurfaceFromDiscoveryCard(card)}
                iconOnly
                light={!showCoverHero}
              />
            ) : null}
            {!showCoverHero && dismissVisible ? (
              <UiTooltip label="Close">
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              </UiTooltip>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={
          embedMode
            ? 'flex flex-col gap-3 px-4 pt-4 pb-1'
            : 'map-peek-summary-body flex shrink-0 flex-col gap-3 overflow-hidden px-4 pt-3.5 pb-2'
        }
      >
        {catalogPlaceSummary ? (
          <PlacePeekBody
            card={card}
            detailAccess={titleDetailAccess}
            onGuestGatedDetail={onGuestGatedAction}
            onBeforeDetailNavigate={onClose}
          />
        ) : (
          <>
            {browseBannerPeek ? (
              <>
                <MapPeekBrowseTitle
                  card={card}
                  detailAccess={titleDetailAccess}
                  onGuestGatedDetail={onGuestGatedAction}
                  onBeforeDetailNavigate={onClose}
                  detailLinkState={detailLinkState}
                  joinStateLoading={joinStateLoading}
                />
                {activityBrowseCopy?.metaLine ? (
                  <DiscoveryBrowseCardMetaSlot
                    line={activityBrowseCopy.metaLine}
                    href={activityBrowseCopy.metaHref}
                    mode="peek"
                  />
                ) : null}
              </>
            ) : (
              <DiscoveryCardHeadline
                sections={card.sections}
                size={mapSummary ? 'sm' : 'lg'}
                lineClamp={mapSummary ? 2 : undefined}
                tone={card.tone}
                detailAccess={titleDetailAccess}
                onGuestGatedDetail={onGuestGatedAction}
                onBeforeDetailNavigate={onClose}
                detailLinkState={detailLinkState}
              />
            )}
            {card.source === 'activity' ? (
              <ActivityDiscoveryPublishedBody
                card={card}
                mapPeekCompact={mapSummary}
                mapPeekBrowseLayout={browseBannerPeek}
              />
            ) : null}
            <DiscoveryCardRatingRow card={card} compact={mapSummary} />
          </>
        )}
        {children}
        {statusBanner ? (
          <p
            className={
              mapSummary
                ? 'mt-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-2 text-xs font-medium leading-snug text-emerald-900'
                : 'mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-medium leading-snug text-emerald-900'
            }
            role="status"
          >
            {statusBanner}
          </p>
        ) : null}
      </div>

      <div
        className={
          embedMode
            ? 'mt-3 flex flex-col gap-2.5 border-t border-neutral-100 px-4 py-4'
            : 'shrink-0 space-y-2.5 border-t border-neutral-100 px-4 py-3'
        }
      >
        {actions}
      </div>
    </div>
  );
};

/** Pin summary bubble — pops from the selected map pin on mobile and desktop. */
export const MapPeekOverlay = ({
  children,
  onClose,
  pinAnchor = null,
  pinKey,
}: {
  children: ReactNode;
  onClose?: () => void;
  pinAnchor?: MapPeekPinAnchor | null;
  pinKey?: string | null;
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(280);
  const [peekFit, setPeekFit] = useState(1);
  const [insets, setInsets] = useState({ top: 12, bottom: 12 });

  useEffect(() => {
    if (!onClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const measure = () => {
      const overlayRect = overlay.getBoundingClientRect();
      const chrome = overlay.closest('.explore-map-stage')?.querySelector('[data-explore-map-chrome]');
      const chromeRect = chrome?.getBoundingClientRect();
      const top =
        chromeRect && chromeRect.height > 0
          ? Math.max(12, Math.round(chromeRect.bottom - overlayRect.top + 8))
          : 12;
      const compact = overlay.clientWidth < 768;
      const bottom = compact ? 96 : 24;
      const available = Math.max(0, overlay.clientHeight - top - bottom);
      const fitEl = fitRef.current;
      if (fitEl) {
        fitEl.style.setProperty('--peek-fit', '1');
        const natural = Math.max(fitEl.scrollHeight, 1);
        const fit = mapPeekFitScale(natural, available);
        fitEl.style.setProperty('--peek-fit', String(fit));
        setPeekFit(fit);
        setCardHeight(natural * fit);
      }
      setOverlaySize({ width: overlay.clientWidth, height: overlay.clientHeight });
      setInsets({ top, bottom });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(overlay);
    if (fitRef.current) observer.observe(fitRef.current);
    return () => observer.disconnect();
  }, [pinKey]);

  const layout = layoutMapPeekBubble({
    overlayWidth: overlaySize.width,
    overlayHeight: overlaySize.height,
    cardHeight,
    pin: pinAnchor,
    topInset: insets.top,
    bottomInset: insets.bottom,
  });

  const bubbleStyle = {
    left: layout.left,
    top: layout.top,
    width: layout.width,
    '--peek-origin-x': `${layout.originX}px`,
    '--peek-origin-y': `${layout.originY}px`,
    '--peek-fit': String(peekFit),
  } as CSSProperties;

  return (
    <div ref={overlayRef} className={EXPLORE_PEEK.position}>
      {onClose ? (
        <button type="button" className={EXPLORE_PEEK.scrim} aria-label="Close" onClick={onClose} />
      ) : null}
      <div
        key={pinKey ?? 'peek'}
        ref={cardRef}
        className={`${EXPLORE_PEEK.inner} z-10 ${overlaySize.width > 0 ? '' : 'invisible'}`}
        style={bubbleStyle}
      >
        <div ref={fitRef} className="map-peek-fit">
          {children}
        </div>
      </div>
    </div>
  );
};
