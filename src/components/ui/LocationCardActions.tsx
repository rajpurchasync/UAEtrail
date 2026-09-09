import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export type LocationCardAccent = 'emerald' | 'amber' | 'violet';

interface LocationCardActionsProps {
  detailPath: string;
  reviewPath: string;
  accent?: LocationCardAccent;
  /** Render inside peek card footer — skip duplicate border/padding. */
  embedded?: boolean;
}

const viewButtonClass: Record<LocationCardAccent, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  amber: 'bg-amber-600 hover:bg-amber-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
};

/** View detail + rate/review CTAs — rendered inside the catalog card shell. */
export const LocationCardActions = ({
  detailPath,
  reviewPath,
  accent = 'emerald',
  embedded = false,
}: LocationCardActionsProps) => (
  <div className={`flex gap-2 ${embedded ? '' : 'border-t border-black/[0.06] px-4 pb-4 pt-3'}`}>
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
  </div>
);
