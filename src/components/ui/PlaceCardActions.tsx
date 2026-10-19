import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { DiscoveryCardDirectionsButton } from '../../explore/ui/DiscoveryCardPresentation';

export type PlaceCardAccent = 'emerald' | 'amber' | 'violet';

interface PlaceCardActionsProps {
  detailPath: string;
  reviewPath: string;
  accent?: PlaceCardAccent;
  /** Render inside peek card footer — skip duplicate border/padding. */
  embedded?: boolean;
  /** Guests: open sign-up instead of navigating to detail/review routes. */
  onGuestGatedAction?: () => void;
  /** Map pin — guests can open directions without signing in. */
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  /** When false, skip footer directions (peek body already has Get Directions). */
  showGuestDirections?: boolean;
}

const viewButtonClass: Record<PlaceCardAccent, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
};

/** View detail + rate/review CTAs — rendered inside the catalog card shell. */
export const PlaceCardActions = ({
  detailPath,
  reviewPath,
  accent = 'emerald',
  embedded = false,
  onGuestGatedAction,
  mapLatitude,
  mapLongitude,
  showGuestDirections = true,
}: PlaceCardActionsProps) => {
  const guestDirections =
    onGuestGatedAction &&
    showGuestDirections &&
    mapLatitude != null &&
    mapLongitude != null;

  return (
  <div className={`flex flex-col gap-2 ${embedded ? '' : 'border-t border-black/[0.06] px-4 pb-4 pt-3'}`}>
    {onGuestGatedAction ? (
      <>
        {guestDirections ? (
          <DiscoveryCardDirectionsButton
            latitude={mapLatitude}
            longitude={mapLongitude}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white"
          />
        ) : null}
        <div className="flex gap-2">
        <button
          type="button"
          onClick={onGuestGatedAction}
          className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold text-white transition-colors ${viewButtonClass[accent]}`}
        >
          View
        </button>
        <button
          type="button"
          onClick={onGuestGatedAction}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white/70 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-white"
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          Rate
        </button>
        </div>
      </>
    ) : (
      <>
        <Link
          to={detailPath}
          className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold text-white transition-colors ${viewButtonClass[accent]}`}
        >
          View
        </Link>
        <Link
          to={reviewPath}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white/70 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-white"
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
          Rate
        </Link>
      </>
    )}
  </div>
  );
};

