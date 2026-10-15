import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXPLORE_SHEET, EXPLORE_Z } from '../../../config/exploreTheme';
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
 * Public activity detail — full-screen on mobile (`/activity/:id` route).
 * Centered scrim modal on `md+`. No global hamburger; back/share on chrome.
 */
export const ActivityConsumerDetailModalShell = ({
  backTo,
  backLabel = 'Back',
  headerChrome,
  headerAction,
  footer,
  children,
}: ActivityConsumerDetailModalShellProps) => {
  const navigate = useNavigate();

  const dismiss = () => {
    navigate(backTo);
  };

  return (
    <div
      className={`fixed inset-0 ${EXPLORE_Z.activityDetailModal} flex flex-col bg-white md:bg-transparent md:items-center md:justify-center md:p-6`}
      role="dialog"
      aria-modal="true"
      data-activity-detail-modal-shell
      data-activity-detail-mobile-fullscreen
    >
      <button
        type="button"
        className={`absolute inset-0 hidden cursor-default md:block ${EXPLORE_SHEET.scrim}`}
        aria-label="Close outing details"
        onClick={dismiss}
      />

      <div
        className={`relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white md:mt-0 md:h-auto md:max-h-[min(88vh,780px)] md:max-w-md md:rounded-3xl md:shadow-2xl md:ring-1 md:ring-black/10`}
      >
        <div className="shrink-0 border-b border-neutral-100 bg-gradient-to-b from-emerald-50/80 to-white px-4 pb-3 pt-2">
          <div className="flex items-center justify-between gap-3 pt-safe-plus-2">
            <MobileBackButton fallbackTo={backTo} label={backLabel} className="shrink-0" />
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
    </div>
  );
};
