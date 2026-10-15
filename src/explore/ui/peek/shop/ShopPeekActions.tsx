import { ExternalLink } from 'lucide-react';
import { isPeekOnlyCatalogProfile } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../../../discovery/discoveryCardModel';
import {
  exploreCardHasMapCoords,
  exploreCardShowsInlineDirections,
} from '../../../../discovery/discoveryCardModel';
import { PRO_MEMBERSHIP_PATH } from '../../../../config/memberRoutes';
import { ExploreCardDirectionsButton } from '../../ExploreCardPresentation';
import { PeekDetailLink } from '../../map-peek/PeekDetailLink';

export type ShopPeekActionsProps = {
  card: DiscoveryCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  externalUrl?: string | null;
};

const viewButtonClass =
  'flex-1 rounded-xl py-2.5 text-center text-sm font-bold text-white transition-colors bg-emerald-600 hover:bg-emerald-700';

const rateButtonClass =
  'flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white/70 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-white';

/** Shop / merchant pin on the activity pin host (`source: shop`). */
export const ShopPeekActions = ({
  card,
  onClose,
  onGuestGatedAction,
  externalUrl = null,
}: ShopPeekActionsProps) => {
  const gate = onGuestGatedAction;
  const peekOnly = isPeekOnlyCatalogProfile(card.catalogProfileExposure);

  if (peekOnly) {
    return (
      <div className="flex flex-col gap-2">
        {exploreCardHasMapCoords(card) ? (
          <ExploreCardDirectionsButton
            latitude={card.mapLatitude}
            longitude={card.mapLongitude}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white"
          />
        ) : null}
        <p className="text-center text-xs text-slate-600">
          Community-submitted shop — map info only. Business accounts can claim a full shop profile via{' '}
          <a href={PRO_MEMBERSHIP_PATH} className="font-semibold text-emerald-800">
            Pro membership
          </a>
          .
        </p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
        >
          Close
        </button>
      </div>
    );
  }

  const showGuestDirections =
    Boolean(gate) && exploreCardHasMapCoords(card) && !exploreCardShowsInlineDirections(card);

  if (card.reviewPath) {
    return (
      <div className="flex flex-col gap-2">
        {showGuestDirections ? (
          <ExploreCardDirectionsButton
            latitude={card.mapLatitude}
            longitude={card.mapLongitude}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white"
          />
        ) : null}
        <div className="flex gap-2">
          <PeekDetailLink
            card={card}
            label="View"
            className={viewButtonClass}
            onGuestGatedAction={gate}
            onBeforeNavigate={onClose}
          />
          <PeekDetailLink
            card={card}
            hrefOverride={card.reviewPath}
            label="Rate"
            className={rateButtonClass}
            onGuestGatedAction={gate}
            onBeforeNavigate={onClose}
          />
        </div>
      </div>
    );
  }

  const primaryClass =
    'block w-full rounded-2xl bg-emerald-500 py-3.5 text-center text-base font-bold text-white';

  return (
    <>
      <PeekDetailLink
        card={card}
        label={card.primaryCta}
        className={primaryClass}
        onGuestGatedAction={gate}
        onBeforeNavigate={onClose}
      />
      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 py-2.5 text-center text-sm font-semibold text-emerald-700"
        >
          {card.secondaryCta ?? 'Visit website'}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-center text-sm font-semibold text-gray-600"
        >
          Close
        </button>
      )}
    </>
  );
};
