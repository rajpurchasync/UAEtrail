import { ReactNode } from 'react';
import { MobileBrandBar } from '../layout/MobileBrandBar';

interface ConsumerHeroBannerProps {
  src: string;
  alt?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  /** Tab roots use a short strip; editorial / rewards pages use a taller hero. */
  size?: 'tab' | 'editorial';
  /** Logo + hamburger overlaid on the banner (mobile PWA). */
  showMobileChrome?: boolean;
  /** Keep logo + menu on the banner at desktop widths (e.g. Profile). */
  chromeOnDesktop?: boolean;
}

/** Compact image banner with page title overlaid on top. */
export const ConsumerHeroBanner = ({
  src,
  alt = '',
  title,
  eyebrow,
  action,
  className = '',
  size = 'tab',
  showMobileChrome = false,
  chromeOnDesktop = false,
}: ConsumerHeroBannerProps) => (
  <div
    className={`consumer-hero-banner ${size === 'editorial' ? 'consumer-hero-banner--editorial' : ''} ${
      showMobileChrome ? 'consumer-hero-banner--mobile-chrome' : ''
    } ${className}`}
  >
    <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
    <div
      className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/45 to-emerald-900/20"
      aria-hidden
    />
    {showMobileChrome && (
      <div
        className={`absolute inset-x-0 top-0 z-10 px-4 pt-safe-plus-2 ${
          chromeOnDesktop ? '' : 'md:hidden'
        }`}
      >
        <MobileBrandBar tone="light" menuOnDesktop />
      </div>
    )}
    {(title || eyebrow || action) && (
      <div
        className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5 ${
          showMobileChrome ? 'pt-12' : ''
        }`}
      >
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="consumer-hero-eyebrow">{eyebrow}</p>}
          {title && <h1 className="consumer-hero-title">{title}</h1>}
        </div>
        {action && <div className="shrink-0 self-end pb-0.5">{action}</div>}
      </div>
    )}
  </div>
);

/** @deprecated Use ConsumerHeroBanner */
export const ConsumerPageBanner = ConsumerHeroBanner;
