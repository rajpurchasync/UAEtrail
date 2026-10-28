import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { readDetailBackPrefersDeclared } from '../../../explore/mapPeekDetailNavState';
import { ConsumerHeaderActions } from '../../../components/layout/ConsumerHeaderActions';
import { MobileBackButton } from '../../../components/mobile/MobileBackButton';
import {
  ConsumerDetailHeaderTypeMark,
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
  const location = useLocation();
  const navigate = useNavigate();
  const preferDeclaredBack = readDetailBackPrefersDeclared(location.state);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { headerFrosted, footerFrosted } = useConsumerDetailScrollChrome(scrollRef, contentRef);

  /** Keep the first block clear of the overlay bar; further scroll passes under the glass. */
  useEffect(() => {
    const header = headerRef.current;
    const scroll = scrollRef.current;
    if (!header || !scroll) return;
    const apply = () => {
      scroll.style.setProperty('--detail-header-pad', `${header.offsetHeight}px`);
    };
    apply();
    const resizeObserver = new ResizeObserver(apply);
    resizeObserver.observe(header);
    return () => resizeObserver.disconnect();
  }, [headerChrome, headerAction, showMenu]);

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
          ref={contentRef}
          className="px-4 pb-6 pt-[var(--detail-header-pad,calc(var(--safe-top)+4.75rem))]"
        >
          {children}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div
          ref={headerRef}
          className={`pointer-events-auto px-4 pb-3 pt-2 ${
            headerFrosted ? CONSUMER_DETAIL_STICKY_HEADER_FROSTED : CONSUMER_DETAIL_STICKY_HEADER_REST
          }`}
        >
          <div className="pt-safe-plus-2">
            <div className="relative flex min-h-11 items-center">
              <MobileBackButton
                fallbackTo={backTo}
                label={backLabel}
                className="relative z-10 shrink-0"
                backBehavior="fallback"
                onPress={preferDeclaredBack ? () => navigate(backTo, { replace: true }) : undefined}
              />
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-16">
                <div className="flex min-w-0 max-w-full items-center justify-center gap-2">
                  {headerChrome ? (
                    <ConsumerDetailHeaderTypeMark
                      emoji={headerChrome.emoji}
                      mark={headerChrome.mark}
                      sizeClass="h-8 w-8"
                    />
                  ) : null}
                  <p className="min-w-0 truncate text-center text-[15px] font-bold leading-tight text-neutral-900">
                    {headerChrome?.label ?? 'Details'}
                  </p>
                </div>
              </div>
              <div className="relative z-10 ml-auto flex shrink-0 items-center justify-end gap-0.5">
                {headerAction}
                {showMenu ? <ConsumerHeaderActions showOnDesktop={false} /> : null}
              </div>
            </div>
          </div>
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
