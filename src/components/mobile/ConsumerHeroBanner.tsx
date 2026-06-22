import { ReactNode } from 'react';

interface ConsumerHeroBannerProps {
  src: string;
  alt?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

/** Compact image banner with page title overlaid on top. */
export const ConsumerHeroBanner = ({
  src,
  alt = '',
  title,
  eyebrow,
  action,
  className = '',
}: ConsumerHeroBannerProps) => (
  <div className={`consumer-hero-banner ${className}`}>
    <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
    <div
      className="absolute inset-0 bg-gradient-to-t from-emerald-950/75 via-emerald-950/35 to-emerald-900/15"
      aria-hidden
    />
    {(title || eyebrow || action) && (
      <div className="absolute inset-0 flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
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
