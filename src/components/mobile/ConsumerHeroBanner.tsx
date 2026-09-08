import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MobileBrandBar } from '../layout/MobileBrandBar';
import { MobileBackButton } from './MobileBackButton';
import { EnvironmentImage } from '../ui/EnvironmentImage';

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
  /** Breadcrumb journey inside the banner (bottom-left). */
  journeyFallbackTo?: string;
  journeyLabel?: string;
  showJourney?: boolean;
}

/** Compact image banner with centered title and bottom breadcrumb. */
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
  journeyFallbackTo,
  journeyLabel,
  showJourney = false,
}: ConsumerHeroBannerProps) => (
  <div
    className={`consumer-hero-banner ${size === 'editorial' ? 'consumer-hero-banner--editorial' : ''} ${
      showMobileChrome ? 'consumer-hero-banner--mobile-chrome' : ''
    } ${desktopChromeOnly ? 'consumer-hero-banner--desktop-chrome' : ''} ${className}`}
  >
    {linkTo ? (
      <Link to={linkTo} aria-label={linkAriaLabel ?? title ?? alt} className="absolute inset-0 z-[1] block">
        <EnvironmentImage src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div
          className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/45 to-emerald-900/20"
          aria-hidden
        />
      </Link>
    ) : (
      <>
        <EnvironmentImage src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
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

    {(title || eyebrow) && (
      <div
        className={`absolute inset-0 z-[2] flex flex-col items-center justify-center px-12 sm:px-16 md:px-20 pointer-events-none ${
          showMobileChrome ? 'pt-10 sm:pt-12' : ''
        } ${showJourney || action ? 'pb-10 sm:pb-11' : ''}`}
      >
        {linkTo ? (
          <Link
            to={linkTo}
            aria-label={linkAriaLabel ?? title ?? alt}
            className="block text-center pointer-events-auto max-w-full"
          >
            {eyebrow && <p className="consumer-hero-eyebrow text-center">{eyebrow}</p>}
            {title && <h1 className="consumer-hero-title text-center">{title}</h1>}
          </Link>
        ) : (
          <div className="text-center max-w-full">
            {eyebrow && <p className="consumer-hero-eyebrow text-center">{eyebrow}</p>}
            {title && <h1 className="consumer-hero-title text-center">{title}</h1>}
          </div>
        )}
      </div>
    )}

    {(showJourney || action) && (
      <div className="absolute inset-x-0 bottom-0 z-[3] flex items-end justify-between gap-3 px-4 pb-3 sm:px-5 sm:pb-4">
        {showJourney ? (
          <MobileBackButton
            tone="light"
            fallbackTo={journeyFallbackTo ?? backTo ?? '/'}
            label={journeyLabel ?? backLabel ?? 'Back'}
            className="min-w-0 flex-1"
          />
        ) : (
          <span aria-hidden />
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )}
  </div>
);

