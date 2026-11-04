import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { isGeographyMapSource } from '@uaetrail/shared-types';
import { Share2, X } from 'lucide-react';
import type { DiscoveryCardModel } from '../../../discovery/discoveryCardModel';
import { EXPLORE_PEEK } from '../../../config/exploreTheme';
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
import { PlacePeekBody } from '../peek/place/PlacePeekBody';
import { PlacePeekHero } from '../peek/place/PlacePeekHero';
import { activityPeekHasMapWireActions } from '../../../activity/activityPeekEngagement';
import { resolvePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';
import { mapPeekDetailNavState } from '../../mapPeekDetailNavState';
import { UiTooltip } from '../../../components/ui/UiTooltip';

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
  const location = useLocation();
  const titleDetailAccess = resolvePeekDetailAccess(card, {
    isGuest: Boolean(onGuestGatedAction),
    joinStateLoading: activityPeekHasMapWireActions(card) ? false : joinStateLoading,
  });
  const detailLinkState = mapPeekDetailNavState(location);
  const shellClass = embedMode
    ? 'overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)] ring-1 ring-black/5'
    : EXPLORE_PEEK.shell;
  const showCoverHero = Boolean(card.coverImage) && !catalogPlaceSummary;
  const showPlaceCatalogHero = catalogPlaceSummary && isGeographyMapSource(card.source);
  const shareIconButtonClass = showCoverHero
    ? 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white hover:bg-black/50 transition-colors'
    : 'inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200/90 hover:bg-neutral-50 transition-colors';

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
      {showCoverHero ? (
        <div
          className={`relative w-full shrink-0 overflow-hidden bg-neutral-100${
            embedMode ? ' aspect-[2/1]' : ' h-[min(28dvh,220px)]'
          }`}
        >
          <EnvironmentImage
            src={card.coverImage ?? undefined}
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
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            </UiTooltip>
          ) : null}
        </div>
      ) : null}

      {!showPlaceCatalogHero ? (
        <div className={`flex shrink-0 items-start justify-between gap-3 px-4 ${showCoverHero ? 'pt-3' : 'pt-4'}`}>
          <DiscoveryCardTypeBadge card={card} size="sm" />
          <div className="flex shrink-0 items-start gap-1.5">
            {isGeographyMapSource(card.source) ? (
              <ExploreWishlistSaveButton card={card} light={!showCoverHero} />
            ) : discoveryCardPeekShowsFollow(card) ? (
              <ExploreFollowButton card={card} light={!showCoverHero} />
            ) : null}
            {card.source === 'activity' && onShareActivity ? (
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
            ) : (
              <ShareButton
                title={card.shareTitle}
                text={card.shareText ?? undefined}
                path={card.sharePath}
                iconOnly
                light={!showCoverHero}
              />
            )}
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
            ? 'px-4 pt-3'
            : 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3'
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
            <DiscoveryCardHeadline
              sections={card.sections}
              size="lg"
              tone={card.tone}
              detailAccess={titleDetailAccess}
              onGuestGatedDetail={onGuestGatedAction}
              onBeforeDetailNavigate={onClose}
              detailLinkState={detailLinkState}
            />
            {card.source === 'activity' ? <ActivityDiscoveryPublishedBody card={card} /> : null}
            <DiscoveryCardRatingRow card={card} />
          </>
        )}
        {children}
        {statusBanner ? (
          <p
            className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-medium leading-snug text-emerald-900"
            role="status"
          >
            {statusBanner}
          </p>
        ) : null}
      </div>

      <div
        className={
          embedMode
            ? 'mt-3 space-y-2 border-t border-neutral-100 px-4 py-3'
            : 'shrink-0 space-y-1.5 border-t border-neutral-100 px-3 py-2'
        }
      >
        {actions}
      </div>
    </div>
  );
};

/** Pin summary above the map — scrim + centered slot on mobile, docked left panel on desktop. */
export const MapPeekOverlay = ({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) => {
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

  return (
    <div className={`${EXPLORE_PEEK.position} ${EXPLORE_PEEK.scrim} pointer-events-none`}>
      {onClose ? (
        <button
          type="button"
          className="pointer-events-auto absolute inset-0 z-0 lg:hidden"
          aria-label="Close"
          onClick={onClose}
        />
      ) : null}
      <div className={`${EXPLORE_PEEK.inner} pointer-events-auto relative z-10`}>{children}</div>
    </div>
  );
};
