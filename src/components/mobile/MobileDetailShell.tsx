import type { ReactNode } from 'react';
import { APP_PAGE_MIN_H_CLASS, APP_SCROLL_BODY_CLASS } from '../../config/layoutScroll';
import { createPortal } from 'react-dom';
import { MobileMenuButton } from '../layout/MobileMenu';
import { ConsumerHeroBanner } from './ConsumerHeroBanner';
import { MobileBackButton } from './MobileBackButton';
import { EnvironmentImage } from '../ui/EnvironmentImage';

const MOBILE_DETAIL_FOOTER_Z = 'z-[1100]';

const MobileDetailFooterPortal = ({
  children,
  flush = false,
}: {
  children: ReactNode;
  flush?: boolean;
}) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className={`md:hidden pointer-events-none fixed inset-x-0 bottom-0 ${MOBILE_DETAIL_FOOTER_Z} ${
        flush ? 'bg-white pb-safe' : 'border-t border-neutral-100 bg-white/95 px-0 pb-safe pt-2 shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur-md'
      }`}
    >
      <div
        className={`pointer-events-auto w-full ${flush ? '' : 'mx-auto max-w-6xl'}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

interface MobileDetailShellProps {
  backTo: string;
  backLabel?: string;
  children: ReactNode;
  /** Optional right-side header action (e.g. cart button) */
  headerAction?: ReactNode;
  /** Show the global mobile menu button in the header (default true). */
  showMenu?: boolean;
  /** Optional clickable hero banner above the sticky header. */
  banner?: {
    src: string;
    alt?: string;
    title?: string;
    eyebrow?: string;
    linkTo?: string;
    desktopChromeOnly?: boolean;
    desktopAction?: ReactNode;
    showMobileChrome?: boolean;
    showJourney?: boolean;
    journeyFallbackTo?: string;
    journeyLabel?: string;
    topRightOverlay?: ReactNode;
  };
  /** Optional fixed bottom action (e.g. join CTA) */
  footer?: ReactNode;
  /** Full-width hero above the sticky header (mobile) — share/actions go in `overlay`. */
  mobileHero?: {
    src: string;
    fallbackSrc?: string;
    alt?: string;
    overlay?: ReactNode;
  };
  /** Edge-to-edge sticky actions (no inset card chrome). */
  flushStickyFooter?: boolean;
  /** Back/menu chrome overlays the mobile hero image (consumer entity detail). */
  overlayMobileHeaderOnHero?: boolean;
  /** Full-bleed white page (public activity consumer template). */
  whitePageChrome?: boolean;
}

/** Mobile detail page with back navigation and optional sticky footer CTA. */
export const MobileDetailShell = ({
  backTo,
  backLabel = 'Back',
  children,
  headerAction,
  showMenu = true,
  banner,
  footer,
  mobileHero,
  flushStickyFooter = false,
  overlayMobileHeaderOnHero = false,
  whitePageChrome = false,
}: MobileDetailShellProps) => {
  const mobileHeaderOverlay = Boolean(mobileHero && overlayMobileHeaderOnHero);

  const mobileHeaderChrome = (
    <div
      className={`relative max-w-6xl mx-auto px-4 pt-safe-plus-2 pb-2 flex items-center justify-between gap-2 ${
        mobileHeaderOverlay ? 'bg-white/75 backdrop-blur-md' : ''
      }`}
    >
      <MobileBackButton fallbackTo={backTo} label={backLabel} className="flex-1 min-w-0" />
      {banner?.title && (
        <h1 className="absolute left-1/2 max-w-[52%] -translate-x-1/2 truncate text-center text-[17px] font-semibold text-neutral-900 pointer-events-none">
          {banner.title}
        </h1>
      )}
      <div className="flex items-center gap-2 shrink-0">
        {headerAction}
        {showMenu && <MobileMenuButton />}
      </div>
    </div>
  );

  return (
  <div
    className={`${APP_PAGE_MIN_H_CLASS} overflow-hidden ${whitePageChrome ? 'bg-white' : 'consumer-bg md:bg-gray-50'} ${
      footer ? 'pb-detail-cta-safe md:pb-8' : ''
    }`}
  >
    {banner && (
      <div className="hidden md:block">
        <ConsumerHeroBanner
          src={banner.src}
          alt={banner.alt}
          title={banner.title}
          eyebrow={banner.eyebrow}
          backTo={backTo}
          backLabel={backLabel}
          linkTo={banner.linkTo ?? backTo}
          linkAriaLabel={banner.linkTo ? backLabel : banner.title ?? banner.alt ?? backLabel}
          showMobileChrome={banner.showMobileChrome ?? true}
          showJourney={banner.showJourney ?? true}
          journeyFallbackTo={banner.journeyFallbackTo ?? backTo}
          journeyLabel={banner.journeyLabel ?? backLabel}
          action={headerAction ?? banner.desktopAction}
          desktopAction={banner.desktopAction}
          topRightOverlay={banner.topRightOverlay}
          desktopChromeOnly={banner.desktopChromeOnly}
          className="animate-fade-up"
        />
      </div>
    )}
    {mobileHero ? (
      <div className="md:hidden relative h-[min(28dvh,220px)] w-full shrink-0 overflow-hidden bg-neutral-100">
        <EnvironmentImage
          src={mobileHero.src}
          fallbackSrc={mobileHero.fallbackSrc}
          alt={mobileHero.alt ?? ''}
          className="h-full w-full object-cover"
          loading="eager"
        />
        {mobileHeaderOverlay ? (
          <div className="absolute inset-x-0 top-0 z-20">{mobileHeaderChrome}</div>
        ) : null}
        {!mobileHeaderOverlay && mobileHero.overlay ? (
          <div className="absolute right-3 top-3 z-10">{mobileHero.overlay}</div>
        ) : null}
        {mobileHeaderOverlay && mobileHero.overlay ? (
          <div className="absolute right-3 top-3 z-30">{mobileHero.overlay}</div>
        ) : null}
      </div>
    ) : null}
    {!mobileHeaderOverlay ? (
      <div
        className={`md:hidden shrink-0 z-30 ${
          whitePageChrome ? 'border-b border-neutral-100 bg-white/95 backdrop-blur-md' : 'glass-header'
        }`}
      >
        {mobileHeaderChrome}
      </div>
    ) : null}
    <div className={`${APP_SCROLL_BODY_CLASS} min-h-0 flex-1`}>{children}</div>
    {footer ? (
      <MobileDetailFooterPortal flush={flushStickyFooter}>{footer}</MobileDetailFooterPortal>
    ) : null}
  </div>
  );
};
