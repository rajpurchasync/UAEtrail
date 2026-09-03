interface HostRatingChipProps {
  rating: number;
  reviewCount: number;
  onClick?: () => void;
}

export const HostRatingChip = ({ rating, reviewCount, onClick }: HostRatingChipProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-end gap-1 rounded-xl bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg shadow-black/10 ring-1 ring-white/80 hover:bg-white active:scale-[0.98] transition-all text-right"
    aria-label="View host rating"
  >
    <span className="text-lg font-extrabold text-emerald-700 tabular-nums leading-none">
      {rating.toFixed(1)}
      <span className="text-[10px] font-semibold text-amber-500/90 ml-0.5">/ 5</span>
    </span>
    <span className="text-[10px] font-semibold text-gray-600">
      {reviewCount} review{reviewCount !== 1 ? 's' : ''}
    </span>
  </button>
);
