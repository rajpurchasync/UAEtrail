import type { ImgHTMLAttributes } from 'react';
import { formatEnvironmentUrl } from '../../utils/formatEnvironmentUrl';

/** <img> that rewrites Docker-internal MinIO/Grafana/Prometheus hosts for the browser. */
export const EnvironmentImage = ({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) => (
  <img {...props} src={src ? formatEnvironmentUrl(src) : src} />
);
