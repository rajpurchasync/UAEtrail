import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from './GlassCard';
import { PRODUCT_RETRY_LABEL } from '../../content/productNorthStar';
import { AsyncLoadingState } from '../ui/AsyncLoadingState';

interface ConsumerErrorCardProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** Inline error banner for consumer hub pages. */
export const ConsumerErrorCard = ({
  message,
  onRetry,
  retryLabel = PRODUCT_RETRY_LABEL,
  className = '',
}: ConsumerErrorCardProps) => (
  <GlassCard padding className={`border-red-200/50 bg-red-50/50 ${className}`.trim()}>
    <p className="text-sm text-red-600">{message}</p>
    {onRetry ? (
      <button type="button" onClick={onRetry} className="mt-2 text-sm font-semibold text-emerald-600">
        {retryLabel}
      </button>
    ) : null}
  </GlassCard>
);

interface ConsumerLoadingSpinnerProps {
  className?: string;
  label?: string;
}

/** Centered loading spinner for list sections. */
export const ConsumerLoadingSpinner = ({
  className = 'py-10',
  label,
}: ConsumerLoadingSpinnerProps) => (
  <AsyncLoadingState variant="centered" className={className} label={label} />
);

interface ConsumerLoadingSkeletonProps {
  rows?: number;
  className?: string;
}

/** Pulse skeleton rows inside a card — profile sections, previews. */
export const ConsumerLoadingSkeleton = ({ rows = 2, className = '' }: ConsumerLoadingSkeletonProps) => (
  <GlassCard padding className={`animate-pulse space-y-3 ${className}`.trim()}>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="h-12 rounded-xl bg-neutral-100" />
    ))}
  </GlassCard>
);

interface ConsumerInlineEmptyProps {
  message: string;
  actionLabel?: string;
  actionTo?: string;
  action?: ReactNode;
}

/** Neutral empty state without emoji hero — secondary tabs, host lists. */
export const ConsumerInlineEmpty = ({ message, actionLabel, actionTo, action }: ConsumerInlineEmptyProps) => (
  <GlassCard padding>
    <p className="text-sm text-neutral-600">{message}</p>
    {action ?? (actionLabel && actionTo ? (
      <Link to={actionTo} className="mt-2 inline-block text-sm font-semibold text-emerald-700">
        {actionLabel}
      </Link>
    ) : null)}
  </GlassCard>
);
