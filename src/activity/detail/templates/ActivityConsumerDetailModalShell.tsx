import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
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
import { ConsumerDetailScrollToTop } from '../../../detail/shell/ConsumerDetailScrollToTop';
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
  /** Extra classes on the sticky footer wrapper (e.g. hide on large screens when CTAs live in-column). */
  footerClassName?: string;
  /** Close (X) navigates here — consumer activity detail → explore map. */
  closeTo?: string;
  children: ReactNode;
  /** Use `backLabel` as shown — no stack-based retitle during route transitions. */
  preferDeclaredBackLabel?: boolean;
};

/**
 * Public activity / place consumer detail — one panel beside the product nav.
 * Join / arrange actions stay in a bottom bar of this same panel (no right rail).
 */
export const ActivityConsumerDetailModalShell = ({
  backTo,
  backLabel = 'Back',
  headerChrome,
  headerAction,
  showMenu = true,
  footer,
  footerClassName = '',
  closeTo,
  children,
  preferDeclaredBackLabel = false,
}: ActivityConsumerDetailModalShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const preferDeclaredBack = readDetailBackPrefersDeclared(location.state);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const { headerFrosted, footerFrosted } = useConsumerDetailScrollChrome(scrollRef, contentRef);

  /** Keep the first block clear of the overlay bar; further scroll passes under the glass. */
  useLayoutEffect(() => {
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

  /** Keep the last block clear of the sticky join bar on phones. */
  useEffect(() => {
    if (!footer) return;
    const footerEl = footerRef.current;
    const scroll = scrollRef.current;
    if (!footerEl || !scroll) return;
    const apply = () => {
      scroll.style.setProperty('--detail-footer-pad', `${footerEl.offsetHeight}px`);
    };
    apply();
    const resizeObserver = new ResizeObserver(apply);
    resizeObserver.observe(footerEl);
    return () => resizeObserver.disconnect();
  }, [footer]);

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
    className="flex h-full min-h-0 max-h-full w-full flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-950 max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:flex-none"
    data-activity-detail-modal-shell
    data-activity-detail-mobile-fullscreen
  >
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none z-30 max-md:absolute max-md:inset-x-0 max-md:top-0 md:relative md:shrink-0">
        <div
          ref={headerRef}
          data-consumer-detail-modal-header
          className={`pointer-events-auto px-4 pb-3 pt-2 md:px-6 lg:px-6 lg:py-1.5 ${
            headerFrosted ? CONSUMER_DETAIL_STICKY_HEADER_FROSTED : CONSUMER_DETAIL_STICKY_HEADER_REST
          }`}
        >
          <div className="pt-safe-plus-2 lg:pt-0">
            <div className="relative flex min-h-11 items-center gap-1 lg:min-h-9">
              <MobileBackButton
                fallbackTo={backTo}
                label={backLabel}
                preferDeclaredLabel={preferDeclaredBackLabel || preferDeclaredBack}
                className="relative z-10 shrink-0 max-lg:min-w-0 lg:min-h-9 lg:min-w-9 lg:justify-center lg:gap-0 lg:rounded-full lg:px-0 lg:[&_span]:hidden"
                backBehavior="fallback"
                onPress={preferDeclaredBack ? () => navigate(backTo, { replace: true }) : undefined}
              />
              <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-16">
                <div className="flex min-w-0 max-w-full items-center justify-center gap-2">
                  {headerChrome ? (
                    <ConsumerDetailHeaderTypeMark
                      emoji={headerChrome.emoji}
                      mark={headerChrome.mark}
                      sizeClass="h-8 w-8 lg:h-6 lg:w-6"
                    />
                  ) : null}
                  <p className="min-w-0 truncate text-center text-[15px] font-bold leading-tight text-neutral-900 lg:text-[13px] lg:font-semibold">
                    {headerChrome?.label ?? 'Details'}
                  </p>
                </div>
              </div>
              <div className="relative z-10 ms-auto flex shrink-0 items-center justify-end gap-0.5 pe-[max(0px,env(safe-area-inset-right,0px))]">
                {closeTo ? (
                  <Link
                    to={closeTo}
                    replace
                    aria-label="Close and return to explore"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200 md:hidden dark:text-neutral-200 dark:hover:bg-neutral-800${
                      showMenu ? ' max-md:hidden' : ''
                    }`}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </Link>
                ) : null}
                {headerAction}
                {showMenu ? (
                  <div className="md:hidden">
                    <ConsumerHeaderActions showOnDesktop={false} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConsumerDetailScrollToTop scrollRef={scrollRef} reserveFooter={Boolean(footer)} />
      <div
        ref={scrollRef}
        data-consumer-detail-scroll
        className={`h-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain scroll-touch ${CONSUMER_DETAIL_SCROLL_CLASS} ${
          footer
            ? 'max-md:pb-[calc(var(--detail-footer-pad,7rem)+var(--safe-bottom,0px)+0.75rem)] md:pb-3 lg:pb-3'
            : 'pb-4 lg:pb-6'
        }`}
      >
        <div
          ref={contentRef}
          className="px-4 pb-5 pt-0 max-md:pt-[var(--detail-header-pad,calc(var(--safe-top)+4.75rem))] md:px-6 md:pb-4 md:pt-2 lg:px-6 lg:pb-3 lg:pt-2"
        >
          <div className="min-w-0 lg:text-[13px] lg:leading-snug">{children}</div>
        </div>
      </div>

      {footer ? (
        <div className={`pointer-events-none z-20 shrink-0 ${footerClassName}`}>
          <div
            ref={footerRef}
            className={`pointer-events-auto ${
              footerFrosted ? CONSUMER_DETAIL_STICKY_FOOTER_FROSTED : CONSUMER_DETAIL_STICKY_FOOTER_REST
            }`}
          >
            <div className="mx-auto w-full max-w-full">{footer}</div>
          </div>
        </div>
      ) : null}
    </div>
  </div>
  );
};
