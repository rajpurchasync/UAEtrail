import { useEffect, type ReactNode } from 'react';
import { MobileBackButton } from '../../../components/mobile/MobileBackButton';

export type ActivityConsumerDetailModalShellProps = {
  backTo: string;
  backLabel?: string;
  /** Center chrome — type emoji + short label (not the outing title). */
  headerChrome?: { emoji: string; label: string };
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * Public activity / place consumer detail — full-screen route page (`/activity/:id`, `/trail/:id`, …).
 * No stacked map modal; back navigates to `backTo` (map when opened from a pin summary).
 */
export const ActivityConsumerDetailModalShell = ({
  backTo,
  backLabel = 'Back',
  headerChrome,
  headerAction,
  footer,
  children,
}: ActivityConsumerDetailModalShellProps) => {
  /** Explore map sets `body { overflow: hidden }` — restore so wheel scroll works if cleanup lags. */
  useEffect(() => {
    const previousHtml = document.documentElement.style.overflow;
    const previousBody = document.body.style.overflow;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    return () => {
      document.documentElement.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, []);

  return (
  <div
    className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-white"
    data-activity-detail-modal-shell
    data-activity-detail-mobile-fullscreen
  >
    <div className="shrink-0 border-b border-neutral-100 bg-gradient-to-b from-emerald-50/80 to-white px-4 pb-3 pt-2">
      <div className="flex items-center justify-between gap-3 pt-safe-plus-2">
        <MobileBackButton
          fallbackTo={backTo}
          label={backLabel}
          className="shrink-0"
          backBehavior="fallback"
        />
        <p
          className="flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate text-center text-sm font-semibold text-neutral-800"
          title={headerChrome?.label}
        >
          {headerChrome ? (
            <>
              <span className="font-emoji text-base leading-none" aria-hidden>
                {headerChrome.emoji}
              </span>
              <span className="truncate">{headerChrome.label}</span>
            </>
          ) : (
            <span className="truncate">Details</span>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-1">{headerAction}</div>
      </div>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-touch px-4 pb-4">
      {children}
    </div>

    {footer ? (
      <div className="shrink-0 border-t border-neutral-100 bg-white px-2 pb-safe pt-3 shadow-[0_-12px_28px_rgba(15,23,42,.07)]">
        {footer}
      </div>
    ) : null}
  </div>
  );
};
