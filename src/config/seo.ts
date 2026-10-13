/** Central SEO constants — keep brand and URLs consistent across meta, schema, and llms.txt */

import { PRODUCT_SITE_DESCRIPTION } from '../content/productNorthStar';

export const SITE_NAME = 'UAE Trail';

/** Browser tab prefix for guest-facing SEO (see `pageTitle`). */
export const SITE_TITLE_BRAND = 'UAETrail';

export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN?.replace(/\/$/, '') ?? 'https://uaetrail.com';

export const SITE_DESCRIPTION = PRODUCT_SITE_DESCRIPTION;

/** Summit hiker — first guest hero slide, OG, and LCP preload. */
export const HOME_HERO_IMAGE_JPEG =
  '/traveler-hiking-mountains-while-having-his-essentials-backpack-optimized.jpg';
export const HOME_HERO_IMAGE_WEBP =
  '/traveler-hiking-mountains-while-having-his-essentials-backpack.webp';

/** Stable public URL for Open Graph and API placeholders. */
export const HOME_HERO_OG_PATH = HOME_HERO_IMAGE_JPEG;

export const toAbsoluteUrl = (pathOrUrl?: string | null): string | undefined => {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${path}`;
};

export const DEFAULT_OG_IMAGE = toAbsoluteUrl(HOME_HERO_OG_PATH)!;

/** Public machine-readable summary for LLM crawlers (`public/llms.txt`). */
export const LLMS_TXT_PATH = '/llms.txt';

export const DEFAULT_OG_IMAGE_ALT =
  'Group getting outdoors in the UAE — find your crew on UAE Trail';

export const pageTitle = (title: string): string => {
  if (title.includes(SITE_TITLE_BRAND) || title.includes(SITE_NAME)) return title;
  return `${SITE_TITLE_BRAND} - ${title}`;
};
