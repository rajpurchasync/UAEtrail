import type { ImgHTMLAttributes } from 'react';
import { formatMediaUrl } from '../../utils/formatMediaUrl';

/** <img> that resolves stored media URLs for browser display. */
export const EnvironmentImage = ({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
  <img {...props} src={src ? formatMediaUrl(src) : src} />
);
