import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MobileBrandBar } from '../layout/MobileBrandBar';

interface ConsumerHeroBannerProps {
  src: string;
  alt?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  desktopAction?: ReactNode;
  backTo?: string;
  backLabel?: string;
  linkTo?: string;
  linkAriaLabel?: string;
  className?: string;
  /** Tab roots use a short strip; editorial / rewards pages use a taller hero. */
  size?: 'tab' | 'editorial';
  /** Logo + hamburger overlaid on the banner (mobile PWA). */
  showMobileChrome?: boolean;
  /** Keep logo + menu on the banner at desktop widths (e.g. Profile). */
  chromeOnDesktop?: boolean;
  /** Render banner chrome only on desktop, leaving mobile to the sticky header. */
  desktopChromeOnly?: boolean;
}

/** Compact image banner with page title overlaid on top. */
export const ConsumerHeroBanner = ({
  src,
  alt = '',
  title,
  eyebrow,
  action,
  desktopAction,
  backTo,
  backLabel,
  linkTo,
  linkAriaLabel,
  className = '',
  size = 'tab',
  showMobileChrome = false,
  chromeOnDesktop = false,
  desktopChromeOnly = false,
}: ConsumerHeroBannerProps) => (
  <div
    className={`consumer-hero-banner ${size === 'editorial' ? 'consumer-hero-banner--editorial' : ''} ${
      showMobileChrome ? 'consumer-hero-banner--mobile-chrome' : ''
    } ${desktopChromeOnly ? 'consumer-hero-banner--desktop-chrome' : ''} ${className}`}
  >
    {linkTo ? (
      <Link to={linkTo} aria-label={linkAriaLabel ?? title ?? alt} className="absolute inset-0 z-[1] block">
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/45 to-emerald-900/20"
          aria-hidden
        />
      </Link>
    ) : (
      <>
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/45 to-emerald-900/20"
          aria-hidden
        />
      </>
    )}
    {showMobileChrome && (
      <div
        className={`absolute inset-x-0 top-0 z-10 px-4 pt-safe-plus-3 ${
          desktopChromeOnly ? 'hidden md:block' : chromeOnDesktop ? '' : 'md:hidden'
        }`}
      >
        <MobileBrandBar
          tone="light"
          backTo={backTo}
          backLabel={backLabel}
          menuOnDesktop
          desktopAction={desktopAction ?? (chromeOnDesktop ? action : undefined)}
        />
      </div>
    )}
    {(title || eyebrow || action) && (
      <div
        className={`absolute inset-x-0 bottom-0 px-4 pb-4 pt-16 sm:px-5 sm:pb-5 sm:pt-20 ${
          showMobileChrome ? 'pt-28 sm:pt-32' : ''
        }`}
      >
        <div className={`min-w-0 flex-1 ${action ? 'pr-20 sm:pr-24' : ''}`}>
          {linkTo ? (
            <Link to={linkTo} aria-label={linkAriaLabel ?? title ?? alt} className="block">
              {eyebrow && <p className="consumer-hero-eyebrow">{eyebrow}</p>}
              {title && <h1 className="consumer-hero-title">{title}</h1>}
            </Link>
          ) : (
            <>
              {eyebrow && <p className="consumer-hero-eyebrow">{eyebrow}</p>}
              {title && <h1 className="consumer-hero-title">{title}</h1>}
            </>
          )}
        </div>
        {action && (
          <div
            className={`absolute bottom-5 right-3 sm:bottom-8 sm:right-5 ${
              chromeOnDesktop && showMobileChrome ? 'md:hidden' : 'md:bottom-7 md:right-10 lg:right-14'
            }`}
          >
            {action}
          </div>
        )}
      </div>
    )}
  </div>
);

/** @deprecated Use ConsumerHeroBanner */
export const ConsumerPageBanner = ConsumerHeroBanner;
