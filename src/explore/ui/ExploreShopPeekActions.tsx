import { ExternalLink } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import {
  exploreCardHasMapCoords,
  exploreCardShowsInlineDirections,
} from '../exploreCardModel';
import { ExploreCardDirectionsButton } from './ExploreCardPresentation';
import { ExplorePeekDetailLink } from './ExplorePeekDetailLink';

type ExploreShopPeekActionsProps = {
  card: ExploreCardModel;
  onClose: () => void;
  onGuestGatedAction?: () => void;
  externalUrl?: string | null;
};

const viewButtonClass =
  'flex-1 rounded-xl py-2.5 text-center text-sm font-bold text-white transition-colors bg-emerald-600 hover:bg-emerald-700';

const rateButtonClass =
  'flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white/70 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-white';

/** Shop map peek — detail/review use `ExplorePeekDetailLink` (same gates as activities/venues). */
export const ExploreShopPeekActions = ({
  card,
  onClose,
  onGuestGatedAction,
  externalUrl = null,
}: ExploreShopPeekActionsProps) => {
  const gate = onGuestGatedAction;
  const showGuestDirections =
    Boolean(gate) &&
    exploreCardHasMapCoords(card) &&
    !exploreCardShowsInlineDirections(card);

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
          <ExplorePeekDetailLink
            card={card}
            label="View"
            className={viewButtonClass}
            onGuestGatedAction={gate}
            onBeforeNavigate={onClose}
          />
          <ExplorePeekDetailLink
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
      <ExplorePeekDetailLink
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
