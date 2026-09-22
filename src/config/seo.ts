/** Central SEO constants — keep brand and URLs consistent across meta, schema, and llms.txt */

import { PRODUCT_SITE_DESCRIPTION } from '../content/productNorthStar';

export const SITE_NAME = 'UAE Trail';

export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN?.replace(/\/$/, '') ?? 'https://uaetrail.com';

export const SITE_DESCRIPTION = PRODUCT_SITE_DESCRIPTION;

/** Self-hosted hero — optimized WebP (~120KB) with JPEG fallback */
export const HOME_HERO_IMAGE_WEBP = '/traveler-hiking-mountains-while-having-his-essentials-backpack.webp';
export const HOME_HERO_IMAGE_JPEG = '/traveler-hiking-mountains-while-having-his-essentials-backpack-optimized.jpg';

export const toAbsoluteUrl = (pathOrUrl?: string | null): string | undefined => {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${path}`;
};

export const DEFAULT_OG_IMAGE = toAbsoluteUrl(HOME_HERO_IMAGE_JPEG)!;

export const DEFAULT_OG_IMAGE_ALT =
  'Group getting outdoors in the UAE — find your crew on UAE Trail';

export const pageTitle = (title: string): string =>
  title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
