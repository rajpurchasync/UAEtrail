import { Loader2 } from 'lucide-react';

export type DetailLoadingAccent = 'emerald' | 'amber' | 'violet' | 'sky' | 'neutral';

const accentClasses: Record<
  DetailLoadingAccent,
  { chip: string; spinner: string; shimmer: string }
> = {
  emerald: {
    chip: 'bg-emerald-200/90',
    spinner: 'text-emerald-600',
    shimmer: 'from-emerald-100/40 via-emerald-50/80 to-emerald-100/40',
  },
  amber: {
    chip: 'bg-amber-200/90',
    spinner: 'text-amber-600',
    shimmer: 'from-amber-100/40 via-amber-50/80 to-amber-100/40',
  },
  violet: {
    chip: 'bg-violet-200/90',
    spinner: 'text-violet-600',
    shimmer: 'from-violet-100/40 via-violet-50/80 to-violet-100/40',
  },
  sky: {
    chip: 'bg-sky-200/90',
    spinner: 'text-sky-600',
    shimmer: 'from-sky-100/40 via-sky-50/80 to-sky-100/40',
  },
  neutral: {
    chip: 'bg-neutral-200/90',
    spinner: 'text-neutral-600',
    shimmer: 'from-neutral-100/40 via-white/80 to-neutral-100/40',
  },
};

const pulseBar = (className: string, delayMs: number) => (
  <div
    className={`animate-pulse rounded-lg bg-neutral-200/90 ${className}`}
    style={{ animationDelay: `${delayMs}ms` }}
    aria-hidden
  />
);

const LoadingDots = () => (
  <span className="inline-flex items-end gap-0.5 pb-0.5" aria-hidden>
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className="inline-block h-1 w-1 rounded-full bg-current opacity-80 animate-bounce"
        style={{ animationDelay: `${index * 140}ms`, animationDuration: '0.85s' }}
      />
    ))}
  </span>
);

export type DetailPageLoadingStateProps = {
  label: string;
  accent?: DetailLoadingAccent;
  /** Full viewport center vs inline under detail chrome. */
  variant?: 'page' | 'embedded';
};

/**
 * Outing / place / shop detail loading — skeleton chrome + spinner label (shared across routes).
 */
export const DetailPageLoadingState = ({
  label,
  accent = 'emerald',
  variant = 'page',
}: DetailPageLoadingStateProps) => {
  const tone = accentClasses[accent];
  const rootClass =
    variant === 'page'
      ? 'app-page-center flex-col bg-gray-50 px-4 py-10'
      : 'max-w-6xl mx-auto px-4 pt-4 pb-8';

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-r animate-shimmer ${tone.shimmer}`}
          aria-hidden
        />
        <div className="relative space-y-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-2.5">
              {pulseBar('h-7 w-[88%]', 0)}
              {pulseBar('h-4 w-[62%]', 120)}
            </div>
            <div
              className={`h-[4.25rem] w-[4.25rem] shrink-0 animate-pulse rounded-xl ${tone.chip}`}
              style={{ animationDelay: '80ms' }}
              aria-hidden
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {pulseBar('h-6 w-16', 200)}
            {pulseBar('h-6 w-24', 280)}
          </div>
          <div className="space-y-2 rounded-xl border border-sky-100/80 bg-sky-50/50 p-3">
            {pulseBar('h-3 w-2/5', 100)}
            {pulseBar('h-4 w-full', 180)}
            {pulseBar('h-3 w-4/5', 260)}
          </div>
          <div className="space-y-2">
            {pulseBar('h-3 w-1/3', 140)}
            {pulseBar('h-10 w-full rounded-xl', 220)}
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-neutral-600">
        <Loader2 className={`h-4 w-4 animate-spin ${tone.spinner}`} aria-hidden />
        <span className="inline-flex items-center gap-1">
          {label}
          <LoadingDots />
        </span>
      </p>
    </div>
  );
};
