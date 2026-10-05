import { createPortal, type ReactNode } from 'react';
import { MobileMenuButton } from '../layout/MobileMenu';
import { ConsumerHeroBanner } from './ConsumerHeroBanner';
import { MobileBackButton } from './MobileBackButton';

const MOBILE_DETAIL_FOOTER_Z = 'z-[1100]';

const MobileDetailFooterPortal = ({ children }: { children: ReactNode }) => {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className={`md:hidden pointer-events-none fixed inset-x-0 bottom-0 ${MOBILE_DETAIL_FOOTER_Z} px-4 pb-safe`}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-6xl">{children}</div>
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
  };
  /** Optional fixed bottom action (e.g. join CTA) */
  footer?: ReactNode;
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
}: MobileDetailShellProps) => (
  <div className={`min-h-screen consumer-bg md:bg-gray-50 ${footer ? 'pb-detail-cta-safe md:pb-8' : ''}`}>
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
          desktopChromeOnly={banner.desktopChromeOnly}
          className="animate-fade-up"
        />
      </div>
    )}
    <div className="md:hidden sticky top-0 z-30 glass-header">
      <div className="relative max-w-6xl mx-auto px-4 pt-safe-plus-2 pb-2 flex items-center justify-between gap-2">
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
    </div>
    {children}
    {footer ? <MobileDetailFooterPortal>{footer}</MobileDetailFooterPortal> : null}
  </div>
);
