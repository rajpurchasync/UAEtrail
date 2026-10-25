import { useEffect, useRef, type ReactNode } from 'react';
import { ConsumerHeaderActions } from '../../../components/layout/ConsumerHeaderActions';
import { MobileBackButton } from '../../../components/mobile/MobileBackButton';
import {
  ConsumerDetailHeaderChromeTitle,
  type ConsumerDetailHeaderMark,
} from '../../../components/mobile/ConsumerDetailHeaderChromeTitle';
import {
  CONSUMER_DETAIL_STICKY_FOOTER_FROSTED,
  CONSUMER_DETAIL_STICKY_FOOTER_REST,
  CONSUMER_DETAIL_STICKY_HEADER_FROSTED,
  CONSUMER_DETAIL_STICKY_HEADER_REST,
} from './activityConsumerDetailSectionStyles';
import { CONSUMER_DETAIL_SCROLL_CLASS } from '../../../config/consumerScrollChrome';
import { useConsumerDetailScrollChrome } from './useConsumerDetailScrollChrome';

export type ActivityConsumerDetailModalShellProps = {
  backTo: string;
  backLabel?: string;
  /** Center chrome — type emoji + short label (not the outing title). */
  headerChrome?: { emoji: string; label: string; mark?: ConsumerDetailHeaderMark };
  headerAction?: ReactNode;
  /** Notifications + hamburger (default true). */
  showMenu?: boolean;
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
  showMenu = true,
  footer,
  children,
}: ActivityConsumerDetailModalShellProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { headerFrosted, footerFrosted } = useConsumerDetailScrollChrome(scrollRef, contentRef);

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
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        className={`min-h-0 h-full overflow-y-auto overscroll-contain scroll-touch ${CONSUMER_DETAIL_SCROLL_CLASS} ${
          footer ? 'pb-detail-cta-safe' : 'pb-4'
        }`}
      >
        <div
          className={`sticky top-0 z-30 px-4 pb-3 pt-2 ${
            headerFrosted ? CONSUMER_DETAIL_STICKY_HEADER_FROSTED : CONSUMER_DETAIL_STICKY_HEADER_REST
          }`}
        >
          <div className="relative flex min-h-11 items-center justify-between gap-3 pt-safe-plus-2">
            <MobileBackButton
              fallbackTo={backTo}
              label={backLabel}
              className="relative z-10 shrink-0"
              backBehavior="fallback"
            />
            {headerChrome ? (
              <div
                className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 justify-center px-[4.25rem]"
              >
                <ConsumerDetailHeaderChromeTitle
                  emoji={headerChrome.emoji}
                  label={headerChrome.label}
                  mark={headerChrome.mark}
                />
              </div>
            ) : (
              <p
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-[58%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-[15px] font-bold text-neutral-900"
              >
                Details
              </p>
            )}
            <div className="relative z-10 flex shrink-0 items-center gap-0.5">
              {headerAction}
              {showMenu ? <ConsumerHeaderActions showOnDesktop={false} /> : null}
            </div>
          </div>
        </div>

        <div ref={contentRef} className="px-4 pb-6">
          {children}
        </div>
      </div>

      {footer ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div
            className={`pointer-events-auto ${
              footerFrosted ? CONSUMER_DETAIL_STICKY_FOOTER_FROSTED : CONSUMER_DETAIL_STICKY_FOOTER_REST
            }`}
          >
            {footer}
          </div>
        </div>
      ) : null}
    </div>
  </div>
  );
};
