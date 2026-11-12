import type { ReactNode } from 'react';

const MotionStatus = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div role="status" aria-live="polite" aria-busy="true" aria-label={label}>
    {children}
  </div>
);
import { DETAIL_LOADING_GENERIC } from '../../content/detailLoadingCopy';
import {
  DetailPageLoadingState,
  type DetailLoadingAccent,
} from './DetailPageLoadingState';
import { LoadingLabelRow, LoadingRing, LoadingSkeletonBars } from './loadingPrimitives';

export type AsyncLoadingVariant =
  /** Full-page center (auth gate, lazy route). */
  | 'page'
  /** Centered ring in a section / list host. */
  | 'centered'
  /** Single horizontal row (toolbars, compact blocks). */
  | 'inline'
  /** In-card skeleton + screen-reader label. */
  | 'section'
  /** Entity detail skeleton (activity, place, shop). */
  | 'detail';

export type AsyncLoadingStateProps = {
  label?: string;
  variant?: AsyncLoadingVariant;
  accent?: DetailLoadingAccent;
  className?: string;
  /** `detail` variant: embedded under detail chrome vs full viewport. */
  detailLayout?: 'page' | 'embedded';
  rows?: number;
};

/**
 * Generic async wait UI — use whenever data is in flight and the real view is not ready.
 */
export const AsyncLoadingState = ({
  label = DETAIL_LOADING_GENERIC,
  variant = 'centered',
  accent = 'emerald',
  className = '',
  detailLayout = 'embedded',
  rows = 3,
}: AsyncLoadingStateProps) => {
  if (variant === 'detail') {
    return (
      <DetailPageLoadingState label={label} accent={accent} variant={detailLayout} />
    );
  }

  const status = (
    <MotionStatus label={label}>
      {variant === 'page' ? (
        <div className={`app-page-center flex-col gap-4 px-4 py-10 ${className}`.trim()}>
          <LoadingRing size="lg" accent={accent} />
          <LoadingLabelRow label={label} accent={accent} size="md" showIcon={false} />
        </div>
      ) : null}

      {variant === 'centered' ? (
        <div
          className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`.trim()}
        >
          <LoadingRing accent={accent} />
          {label !== DETAIL_LOADING_GENERIC ? (
            <LoadingLabelRow
              label={label}
              accent={accent}
              className="!justify-center"
              showIcon={false}
            />
          ) : null}
        </div>
      ) : null}

      {variant === 'inline' ? (
        <div className={`flex items-center gap-2 py-2 ${className}`.trim()}>
          <LoadingRing size="sm" accent={accent} />
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {label}
            <span className="sr-only"> — loading</span>
          </span>
        </div>
      ) : null}

      {variant === 'section' ? (
        <div className={`space-y-3 py-1 ${className}`.trim()}>
          <LoadingSkeletonBars rows={rows} />
          <LoadingLabelRow label={label} accent={accent} className="!justify-start" />
        </div>
      ) : null}
    </MotionStatus>
  );

  return status;
};
