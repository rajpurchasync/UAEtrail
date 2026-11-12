import { Loader2 } from 'lucide-react';
import type { DetailLoadingAccent } from './DetailPageLoadingState';
import './loadingPrimitives.css';

export const loadingAccentSpinnerClass: Record<DetailLoadingAccent, string> = {
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  violet: 'text-violet-600',
  sky: 'text-sky-600',
  neutral: 'text-neutral-600',
};

/** Three dots that bounce the full em-box height of the surrounding label. */
export const LoadingDots = () => (
  <span className="loading-dots" aria-hidden>
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className="loading-dots__dot"
        style={{ animationDelay: `${index * 140}ms` }}
      />
    ))}
  </span>
);

type LoadingRingProps = {
  size?: 'sm' | 'md' | 'lg';
  accent?: DetailLoadingAccent;
  className?: string;
};

const ringSizes: Record<NonNullable<LoadingRingProps['size']>, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

const ringBorderAccent: Record<DetailLoadingAccent, string> = {
  emerald: 'border-emerald-600',
  amber: 'border-amber-600',
  violet: 'border-violet-600',
  sky: 'border-sky-600',
  neutral: 'border-neutral-500',
};

/** Brand loading ring — single spinner treatment across consumer surfaces. */
export const LoadingRing = ({ size = 'md', accent = 'emerald', className = '' }: LoadingRingProps) => (
  <span
    className={`inline-block animate-spin rounded-full border-2 border-t-transparent ${ringSizes[size]} ${ringBorderAccent[accent]} ${className}`.trim()}
    aria-hidden
  />
);

export const LoadingLabelRow = ({
  label,
  accent = 'emerald',
  size = 'sm',
  className = '',
  /** Hide when a sibling `LoadingRing` already provides the spinner. */
  showIcon = true,
}: {
  label: string;
  accent?: DetailLoadingAccent;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}) => (
  <p
    className={`flex items-center justify-center gap-2 font-semibold text-neutral-600 dark:text-neutral-300 ${
      size === 'sm' ? 'text-sm' : 'text-base'
    } ${className}`.trim()}
  >
    {showIcon ? (
      <Loader2 className={`h-4 w-4 animate-spin ${loadingAccentSpinnerClass[accent]}`} aria-hidden />
    ) : null}
    <span className="inline-flex items-center gap-1">
      {label}
      <LoadingDots />
    </span>
  </p>
);

export const LoadingSkeletonBars = ({
  rows = 2,
  className = '',
}: {
  rows?: number;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`.trim()} aria-hidden>
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        className="h-3 animate-pulse rounded-md bg-neutral-200/90 dark:bg-neutral-700"
        style={{ width: `${72 - (index % 3) * 12}%`, animationDelay: `${index * 120}ms` }}
      />
    ))}
  </div>
);
