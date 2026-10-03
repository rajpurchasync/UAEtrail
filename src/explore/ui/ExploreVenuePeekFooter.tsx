import type { ExploreCardModel } from '../exploreCardModel';
import { exploreCardHasMapCoords } from '../exploreCardModel';
import { ExploreCardDirectionsButton } from './ExploreCardPresentation';

export const EXPLORE_VENUE_PLAN_TRIP_LABEL = 'Plan trip';

const primaryButtonClass: Record<'emerald' | 'amber' | 'violet', string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
};

const venuePeekAccent = (card: ExploreCardModel): 'emerald' | 'amber' | 'violet' => {
  if (card.kind === 'camping') return 'amber';
  if (card.kind === 'event') return 'violet';
  return 'emerald';
};

interface ExploreVenuePeekFooterProps {
  card: ExploreCardModel;
  onPlanTrip: () => void;
  /** Guests: sign-up before organizing. */
  onGuestGatedPlanTrip?: () => void;
}

/** Location / spot map peek — Plan trip (primary) and Get directions (secondary). */
export const ExploreVenuePeekFooter = ({
  card,
  onPlanTrip,
  onGuestGatedPlanTrip,
}: ExploreVenuePeekFooterProps) => {
  const accent = venuePeekAccent(card);
  const primaryClass = `block w-full rounded-2xl py-3 text-center text-sm font-bold text-white transition-colors ${primaryButtonClass[accent]}`;
  const hasCoords = exploreCardHasMapCoords(card);

  const planTripControl = onGuestGatedPlanTrip ? (
    <button type="button" onClick={onGuestGatedPlanTrip} className={primaryClass}>
      {EXPLORE_VENUE_PLAN_TRIP_LABEL}
    </button>
  ) : (
    <button type="button" onClick={onPlanTrip} className={primaryClass}>
      {EXPLORE_VENUE_PLAN_TRIP_LABEL}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      {planTripControl}
      {hasCoords ? (
        <ExploreCardDirectionsButton
          latitude={card.mapLatitude}
          longitude={card.mapLongitude}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200/80 bg-white py-3 text-sm font-semibold text-gray-900 shadow-sm"
        />
      ) : null}
    </div>
  );
};
