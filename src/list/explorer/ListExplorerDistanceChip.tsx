import { Navigation } from 'lucide-react';

type ListExplorerDistanceChipProps = {
  label: string;
  /** Dark map-style overlay on thumbnail cards. */
  variant?: 'light' | 'dark';
  className?: string;
};

/** Distance from viewer — compact chip for list / near-me sort. */
export const ListExplorerDistanceChip = ({
  label,
  variant = 'light',
  className = '',
}: ListExplorerDistanceChipProps) => (
  <span
    className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none sm:text-[11px] ${
      variant === 'dark'
        ? 'border-white/25 bg-black/45 text-white backdrop-blur-[2px]'
        : 'border-emerald-200/80 bg-emerald-50/90 text-emerald-900'
    } ${className}`}
  >
    <Navigation className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
    <span>{label}</span>
  </span>
);
