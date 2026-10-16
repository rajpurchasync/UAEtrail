import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { ExploreCardModel } from '../../exploreCardModel';
import { EXPLORE_PEEK, EXPLORE_SHEET } from '../../../config/exploreTheme';
import { EnvironmentImage } from '../../../components/ui/EnvironmentImage';
import { ShareButton } from '../../../components/ui/ShareButton';
import { ExploreFollowButton } from '../ExploreFollowButton';
import { exploreCardPeekShowsFollow } from '../../exploreCardModel';
import {
  ExploreCardHeadline,
  ExploreCardRatingRow,
  ExploreCardTypeBadge,
  ExploreVenueImageBadges,
} from '../ExploreCardPresentation';
import { ActivityDiscoveryPublishedBody } from '../../../discovery/ActivityDiscoveryPublishedBody';
import { PlacePeekBody } from '../peek/place/PlacePeekBody';
import { PlacePeekHero } from '../peek/place/PlacePeekHero';
import { activityPeekHasMapWireActions } from '../../../activity/activityPeekEngagement';
import { resolvePeekDetailAccess } from '../../../access/resolvePeekDetailAccess';

export type MapPeekShellProps = {
  card: ExploreCardModel;
  onClose: () => void;
  /** Summary card CTA block (wire actions or join flow — not a full-page footer). */
  actions: ReactNode;
  children?: ReactNode;
  joinStateLoading?: boolean;
  onGuestGatedAction?: () => void;
  /** Inline rail / list — hide dismiss controls on the card chrome. */
  embedMode?: boolean;
  statusBanner?: string | null;
  /** Catalog place pins (`source: venue`) — hero + kind facts via `PlacePeekCard`. */
  catalogPlaceSummary?: boolean;
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
  statusBanner = null,
  catalogPlaceSummary = false,
}: MapPeekShellProps) => {
  const titleDetailAccess = resolvePeekDetailAccess(card, {
    isGuest: Boolean(onGuestGatedAction),
    joinStateLoading: activityPeekHasMapWireActions(card) ? false : joinStateLoading,
  });
  const shellClass = embedMode
    ? 'overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(15,23,42,.16)] ring-1 ring-black/5'
    : EXPLORE_PEEK.shell;
  const showCoverHero = Boolean(card.coverImage) && !catalogPlaceSummary;
  const showPlaceCatalogHero = catalogPlaceSummary && card.source === 'venue';

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
            src={card.coverImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          <ExploreVenueImageBadges card={card} />
          {!embedMode ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {!showPlaceCatalogHero ? (
        <div className={`flex shrink-0 items-start justify-between gap-3 px-4 ${showCoverHero ? 'pt-3' : 'pt-4'}`}>
          <ExploreCardTypeBadge card={card} size="sm" />
          <div className="flex items-center gap-1.5">
            {exploreCardPeekShowsFollow(card) ? (
              <ExploreFollowButton card={card} light={!showCoverHero} />
            ) : null}
            <ShareButton
              title={card.shareTitle}
              text={card.shareText ?? undefined}
              path={card.sharePath}
              iconOnly
              light={!showCoverHero}
            />
            {!showCoverHero && !embedMode ? (
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-gray-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
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
            <ExploreCardHeadline
              sections={card.sections}
              size="lg"
              tone={card.tone}
              detailAccess={titleDetailAccess}
              onGuestGatedDetail={onGuestGatedAction}
              onBeforeDetailNavigate={onClose}
            />
            {card.source === 'activity' ? <ActivityDiscoveryPublishedBody card={card} /> : null}
            <ExploreCardRatingRow card={card} />
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
            : 'shrink-0 space-y-2 border-t border-neutral-100 px-4 py-3'
        }
      >
        {actions}
      </div>
    </div>
  );
};

/** Floating pin summary above the map projection (scrim + centered slot). */
export const MapPeekOverlay = ({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose?: () => void;
}) => (
  <div className={`${EXPLORE_PEEK.position} ${EXPLORE_SHEET.scrim} pointer-events-none`}>
    {onClose ? (
      <button
        type="button"
        className="pointer-events-auto absolute inset-0 z-0"
        aria-label="Close"
        onClick={onClose}
      />
    ) : null}
    <div className={`${EXPLORE_PEEK.inner} pointer-events-auto relative z-10`}>{children}</div>
  </div>
);
