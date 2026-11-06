import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { formatMediaUrl, formatMediaCatalogUrl } from '../../utils/formatMediaUrl';

type EnvironmentImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Used when `src` fails to load (404, bad storage key, etc.). */
  fallbackSrc?: string;
  /** Prefer stored `-thumb.jpg` for map/list covers; falls back to full asset on error. */
  catalogThumb?: boolean;
};

/** <img> that resolves stored media URLs for browser display. */
export const EnvironmentImage = ({
  src,
  fallbackSrc,
  catalogThumb,
  onError,
  ...props
}: EnvironmentImageProps) => {
  const [failed, setFailed] = useState(false);
  const fullUrl = src ? formatMediaUrl(src) : src;
  const resolvedPrimary =
    catalogThumb && src ? formatMediaCatalogUrl(src) : fullUrl;
  const resolvedFallback = fallbackSrc ? formatMediaUrl(fallbackSrc) : fullUrl;
  const displaySrc = failed && resolvedFallback ? resolvedFallback : resolvedPrimary;

  return (
    <img
      {...props}
      src={displaySrc}
      onError={(event) => {
        if (!failed && resolvedFallback && displaySrc !== resolvedFallback) {
          setFailed(true);
          return;
        }
        onError?.(event);
      }}
    />
  );
};
