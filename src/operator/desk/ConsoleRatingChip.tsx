interface ConsoleRatingChipProps {
  rating: number;
  reviewCount: number;
  onClick?: () => void;
}

/** Compact host rating for publishing console mobile header. */
export const ConsoleRatingChip = ({ rating, reviewCount, onClick }: ConsoleRatingChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex flex-col items-end gap-0 rounded-lg bg-white/95 px-1.5 py-1 text-right ring-1 ring-neutral-200/80 backdrop-blur-sm transition-all hover:bg-white active:scale-[0.98]"
    aria-label={`Host rating ${rating.toFixed(1)} out of 5 from ${reviewCount} review${reviewCount !== 1 ? 's' : ''}`}
  >
    <span className="text-xs font-bold leading-none tabular-nums text-emerald-700">
      {rating.toFixed(1)}
      <span className="ml-0.5 text-[9px] font-semibold text-amber-500/90">/5</span>
    </span>
    <span className="text-[9px] font-medium leading-tight text-neutral-500">
      {reviewCount} review{reviewCount !== 1 ? 's' : ''}
    </span>
  </button>
);
