import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MOBILE_PRODUCT_HEADER_FROSTED } from '../../config/consumerScrollChrome';
import { APP_PAGE_MIN_H_CLASS, APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import { shouldShowMobileUnifiedTabHeader } from '../../config/mobileTabHeader';
import { shouldShowConsumerShellHamburger } from '../../config/platform';
import { useAppScrollFrostedHeader } from '../../hooks/useAppScrollFrostedHeader';
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
}

const maxWidthClass = {
  '4xl': 'max-w-4xl md:max-w-none',
  '7xl': 'max-w-7xl md:max-w-none',
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
}: ConsumerShellProps) => {
  const { pathname, search } = useLocation();
  const { user } = useAuth();
  const headerFrosted = useAppScrollFrostedHeader();
  const layout: ConsumerLayout = layoutProp ?? (back ? 'stack' : 'tab');
  const layoutUnifiedHeader = shouldShowMobileUnifiedTabHeader(pathname, search, Boolean(user));
  const effectiveSuppressMobileHeader = suppressMobileHeader || layoutUnifiedHeader;
  const shellHamburger = shouldShowConsumerShellHamburger(pathname);
  const headerTrailing = action ?? (shellHamburger ? <ConsumerHeaderActions showOnDesktop={false} /> : null);
  const barTitle = navTitle ?? title;
  const pad = flush ? '' : 'px-4 sm:px-6 lg:px-8';
  const showTabTitleStrip = layout === 'tab' && title && !banner;
  const showTabActionInStrip = layout === 'tab' && action && !banner;
  const mobileUnifiedTitle = title ?? navTitle;
  const showMobileUnifiedHeader =
    !effectiveSuppressMobileHeader &&
    Boolean(mobileUnifiedTitle || back || leading || showJourney || action) &&
    (Boolean(banner) || layout === 'tab' || layout === 'editorial' || layout === 'stack');
  const hasTabSticky =
    layout === 'tab' && Boolean((toolbar && !banner) || showTabTitleStrip || showTabActionInStrip);
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
          className={`shrink-0 z-40 md:bg-white/90 md:border-b md:border-gray-100 ${mobileStickyChromeClass}`}
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
                  <div className="justify-self-end flex items-center justify-end min-w-[44px]">
                    {headerTrailing}
                  </div>
                </div>
              </div>
            )}

            {showJourney && !banner && (
              <div className="hidden md:block pt-safe-plus-2 pb-1">
                <MobileBackButton fallbackTo={journeyFallbackTo} label={journeyLabel} />
              </div>
            )}
            {layout === 'stack' && (
              <>
                <div className={`relative hidden md:flex items-center min-h-[44px] pb-2 md:pt-4 ${showJourney && !banner ? 'pt-1' : 'pt-safe-plus-2'}`}>
                  {back && !showJourney && (
                    <div className="absolute left-0 z-10 md:hidden">
                      <MobileBackButton
                        fallbackTo={back.fallbackTo ?? '/'}
                        label={back.label ?? 'Back'}
                        backBehavior="fallback"
                      />
                    </div>
                  )}
                  {barTitle && (
                    <h1 className="flex-1 text-center text-[17px] font-semibold text-neutral-900 truncate px-14 md:px-0 md:text-left md:text-xl md:font-bold">
                      {barTitle}
                    </h1>
                  )}
                  {action && (
                    <div className="absolute right-0 z-10 shrink-0 md:relative md:ml-auto">{action}</div>
                  )}
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

            {layout === 'tab' && (
              <div className="hidden md:block pt-safe-plus-2 pb-3 md:py-4">
                {showTabTitleStrip && (
                  <ConsumerTabBanner title={title!} action={showTabActionInStrip ? action : undefined} />
                )}
                {toolbar && <div className={showTabTitleStrip ? 'mt-3' : ''}>{toolbar}</div>}
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
        className={`${APP_SCROLL_BODY_CLASS} ${maxWidthClass[maxWidth]} w-full max-w-full min-w-0 mx-auto ${flush ? '' : `${pad} py-4 md:py-6`} ${
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
