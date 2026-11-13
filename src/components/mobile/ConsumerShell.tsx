import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MOBILE_PRODUCT_HEADER_FROSTED } from '../../config/consumerScrollChrome';
import { APP_PAGE_MIN_H_CLASS, APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import { shouldShowMobileUnifiedTabHeader } from '../../config/mobileTabHeader';
import { shouldShowProductShellHamburger } from '../../config/platform';
import { isWideNavRootPath } from '../../config/desktopNav';
import { useAppScrollFrostedHeader } from '../../hooks/useAppScrollFrostedHeader';
import { useMinWidthMd } from '../../hooks/useMinWidthMd';
import { ConsumerHeaderActions } from '../layout/ConsumerHeaderActions';
import { MobileBackButton } from './MobileBackButton';
import { MobileProfileHeaderLink } from './MobileProfileHeaderLink';
import { ConsumerPageHeading } from './ConsumerPageHeading';
import { ConsumerTabBanner } from './ConsumerTabBanner';
import { ConsumerHeroBanner } from './ConsumerHeroBanner';

/** tab — root screen: hero banner + optional tools */
export type ConsumerLayout = 'tab' | 'stack' | 'editorial';

interface ConsumerShellProps {
  title?: string;
  navTitle?: string;
  eyebrow?: string;
  subtitle?: string;
  layout?: ConsumerLayout;
  banner?: { src: string; alt?: string };
  action?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  maxWidth?: '4xl' | '7xl';
  back?: { fallbackTo?: string; label?: string; backBehavior?: 'history' | 'fallback' };
  /** Hide mobile sticky title row — use Layout MobileTabHeader on bottom-nav tabs. */
  suppressMobileHeader?: boolean;
  /** Trips-style toolbar: no hairline under search/filter on mobile. */
  suppressMobileToolbarBorder?: boolean;
  /** @deprecated Use Layout MobileTabHeader leading slot. */
  leading?: 'profile';
  showJourney?: boolean;
  journey?: { fallbackTo?: string; label?: string };
  /** Close (X) — e.g. member profile → explore map. */
  closeTo?: string;
}

const maxWidthClass = {
  '4xl': 'max-w-4xl md:max-w-none lg:max-w-5xl',
  '7xl': 'max-w-7xl md:max-w-none lg:max-w-7xl',
};

export const ConsumerShell = ({
  title,
  navTitle,
  eyebrow,
  subtitle,
  layout: layoutProp,
  banner,
  action,
  toolbar,
  children,
  flush = false,
  maxWidth = '7xl',
  back,
  suppressMobileHeader = false,
  suppressMobileToolbarBorder = false,
  leading,
  showJourney = true,
  journey,
  closeTo,
}: ConsumerShellProps) => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const headerFrosted = useAppScrollFrostedHeader();
  const isDesktopMd = useMinWidthMd();
  const layout: ConsumerLayout = layoutProp ?? (back ? 'stack' : 'tab');
  const layoutUnifiedHeader = shouldShowMobileUnifiedTabHeader(pathname, search, Boolean(user));
  const effectiveSuppressMobileHeader = suppressMobileHeader || layoutUnifiedHeader;
  const shellHamburger = shouldShowProductShellHamburger(pathname);
  const shellMenu = shellHamburger ? <ConsumerHeaderActions showOnDesktop={false} /> : null;
  const headerTrailing =
    action && shellMenu ? (
      <div className="flex shrink-0 items-center gap-0.5">
        {action}
        {shellMenu}
      </div>
    ) : (
      action ?? shellMenu
    );
  const barTitle = navTitle ?? title;
  const pad = flush ? '' : 'px-4 sm:px-6 lg:px-8';
  const showTabTitleStrip = layout === 'tab' && title && !banner;
  /** Layout `MobileTabHeader` owns the title on mobile — keep desktop `ConsumerTabBanner` only. */
  const showTabTitleInChrome = showTabTitleStrip && (!layoutUnifiedHeader || isDesktopMd);
  const showTabActionInStrip = layout === 'tab' && action && !banner;
  const mobileUnifiedTitle = title ?? navTitle;
  const showMobileUnifiedHeader =
    !effectiveSuppressMobileHeader &&
    Boolean(mobileUnifiedTitle || back || leading || showJourney || action) &&
    (Boolean(banner) || layout === 'tab' || layout === 'editorial' || layout === 'stack');
  const hasTabSticky =
    layout === 'tab' && Boolean((toolbar && !banner) || showTabTitleInChrome || showTabActionInStrip);
  const hasEditorialSticky =
    layout === 'editorial' && !banner && Boolean(toolbar || back || action);
  const hasStackSticky = layout === 'stack' && !banner;
  const hasStickyChrome =
    showMobileUnifiedHeader || hasStackSticky || hasEditorialSticky || hasTabSticky;
  const bannerPad = layout === 'editorial' ? 'px-0 sm:px-6 lg:px-8' : 'px-0 md:px-4 lg:px-8';
  const journeyFallbackTo = journey?.fallbackTo ?? back?.fallbackTo ?? '/';
  const journeyLabel = journey?.label ?? back?.label ?? 'Back';

  const mobileStickyChromeClass = headerFrosted
    ? MOBILE_PRODUCT_HEADER_FROSTED
    : layout === 'tab'
      ? 'consumer-top-strip'
      : 'glass-header';

  return (
    <div className={`${APP_PAGE_MIN_H_CLASS} consumer-bg md:bg-gray-50 overflow-hidden max-w-full`}>
      {(layout === 'tab' || layout === 'editorial') && banner && (
        <div className={`hidden md:block shrink-0 ${maxWidthClass[maxWidth]} mx-auto min-w-0 max-w-full ${bannerPad} md:pt-safe-plus-2`}>
          <ConsumerHeroBanner
            src={banner.src}
            alt={banner.alt}
            title={title}
            eyebrow={layout === 'editorial' ? eyebrow : undefined}
            action={layout === 'tab' ? action : undefined}
            size={layout === 'editorial' ? 'editorial' : 'tab'}
            showMobileChrome
            showJourney={showJourney}
            journeyFallbackTo={journeyFallbackTo}
            journeyLabel={journeyLabel}
            className="animate-fade-up"
          />
        </div>
      )}

      {banner && toolbar && (
        <div className={`hidden md:block shrink-0 ${maxWidthClass[maxWidth]} mx-auto min-w-0 max-w-full ${pad} pt-3 pb-3 md:pb-4`}>
          {toolbar}
        </div>
      )}

      {hasStickyChrome && (
        <div
          className={`consumer-shell-chrome shrink-0 z-40 md:bg-white/90 md:border-b md:border-gray-100 lg:border-b-0 lg:bg-transparent ${mobileStickyChromeClass}`}
        >
          <div className={`${maxWidthClass[maxWidth]} mx-auto min-w-0 max-w-full ${pad}`}>
            {showMobileUnifiedHeader && (
              <div className="md:hidden">
                <div className="grid grid-cols-[minmax(72px,auto)_1fr_minmax(44px,auto)] items-center gap-1 pt-safe-plus-2 pb-2 min-h-[44px]">
                  <div className="justify-self-start">
                    {leading === 'profile' ? (
                      <MobileProfileHeaderLink activeOnProfile={mobileUnifiedTitle === 'Profile'} />
                    ) : (showJourney || back) ? (
                      <MobileBackButton
                        fallbackTo={back?.fallbackTo ?? journeyFallbackTo}
                        label={back?.label ?? journeyLabel}
                        backBehavior={back?.backBehavior ?? 'fallback'}
                        className="min-h-[36px] py-0 -ml-1"
                      />
                    ) : null}
                  </div>
                  {mobileUnifiedTitle ? (
                    <h1 className="truncate text-center text-[17px] font-semibold text-neutral-900 px-1">
                      {mobileUnifiedTitle}
                    </h1>
                  ) : (
                    <span aria-hidden />
                  )}
                  <div className="justify-self-end flex items-center justify-end gap-0.5 min-w-[44px]">
                    {closeTo ? (
                      <Link
                        to={closeTo}
                        replace
                        aria-label="Close"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
                      >
                        <X className="h-5 w-5" aria-hidden />
                      </Link>
                    ) : null}
                    {headerTrailing}
                  </div>
                </div>
              </div>
            )}

            {showJourney &&
              !banner &&
              !back &&
              !(layout === 'tab' && isWideNavRootPath(pathname)) && (
              <div className="hidden md:block pt-safe-plus-2 pb-1">
                <MobileBackButton fallbackTo={journeyFallbackTo} label={journeyLabel} />
              </div>
            )}
            {layout === 'stack' && (
              <>
                <div
                  className={`relative hidden md:flex min-h-[44px] items-center pb-2 md:pt-4 ${showJourney && !banner ? 'pt-1' : 'pt-safe-plus-2'}`}
                >
                  <div className="relative z-10 flex min-w-[5.5rem] shrink-0 items-center gap-1">
                    {back ? (
                      <MobileBackButton
                        fallbackTo={back.fallbackTo ?? '/'}
                        label={back.label ?? 'Back'}
                        backBehavior={back.backBehavior ?? 'fallback'}
                        className="-ml-1"
                      />
                    ) : null}
                  </div>
                  {barTitle ? (
                    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-28">
                      <h1 className="min-w-0 max-w-full truncate text-center text-xl font-bold text-neutral-900">
                        {barTitle}
                      </h1>
                    </div>
                  ) : null}
                  <div className="relative z-10 ms-auto flex min-w-[5.5rem] shrink-0 items-center justify-end">
                    {action ?? null}
                  </div>
                </div>
                {toolbar && <div className="pb-3 md:pb-4">{toolbar}</div>}
              </>
            )}

            {layout === 'editorial' && (
              <>
                {(back || action) && (
                  <div className="hidden md:flex items-center justify-between gap-3 pt-safe-plus-2 md:pt-4 pb-2 md:pb-3">
                    {back ? (
                      <MobileBackButton
                        fallbackTo={back.fallbackTo ?? '/'}
                        label={back.label ?? 'Home'}
                        backBehavior="fallback"
                      />
                    ) : (
                      <span className="w-10" aria-hidden />
                    )}
                    {action && <div className="shrink-0 ml-auto">{action}</div>}
                  </div>
                )}
                {toolbar && <div className="pb-3 md:pb-4">{toolbar}</div>}
              </>
            )}

            {layout === 'tab' && (showTabTitleInChrome || toolbar) && (
              <div className={`hidden md:block pt-safe-plus-2 pb-2 md:py-2 lg:px-3 lg:py-1.5 ${flush ? 'md:px-4' : ''}`}>
                {showTabTitleInChrome && (
                  <ConsumerTabBanner title={title!} action={showTabActionInStrip ? action : undefined} />
                )}
                {toolbar && <div className={showTabTitleInChrome ? 'mt-2 lg:mt-1.5' : ''}>{toolbar}</div>}
              </div>
            )}
            {layout === 'tab' && toolbar && (
              <div
                className={`md:hidden pb-3 ${suppressMobileToolbarBorder ? '' : 'border-b border-black/[0.04]'}`}
              >
                {toolbar}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`${APP_SCROLL_BODY_CLASS} ${maxWidthClass[maxWidth]} w-full max-w-full min-w-0 mx-auto ${flush ? '' : `${pad} py-3 md:py-4`} ${
          !hasStickyChrome && !banner ? 'pt-safe-plus-2' : ''
        } ${banner && !hasStickyChrome ? 'pt-0 md:pt-2' : ''}`}
      >
        {title && layout === 'editorial' && !banner && (
          <ConsumerPageHeading
            title={title}
            eyebrow={eyebrow}
            subtitle={subtitle}
            className="md:mb-6"
          />
        )}

        {children}
      </div>
    </div>
  );
};
