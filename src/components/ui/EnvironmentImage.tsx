import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { formatMediaUrl } from '../../utils/formatMediaUrl';

type EnvironmentImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Used when `src` fails to load (404, bad storage key, etc.). */
  fallbackSrc?: string;
};

/** <img> that resolves stored media URLs for browser display. */
export const EnvironmentImage = ({ src, fallbackSrc, onError, ...props }: EnvironmentImageProps) => {
  const [failed, setFailed] = useState(false);
  const resolvedPrimary = src ? formatMediaUrl(src) : src;
  const resolvedFallback = fallbackSrc ? formatMediaUrl(fallbackSrc) : undefined;
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
