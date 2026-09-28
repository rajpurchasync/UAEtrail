/** Central SEO constants — keep brand and URLs consistent across meta, schema, and llms.txt */

import homeHeroJpeg from '../assets/landing/home-hero.jpg';
import homeHeroWebp from '../assets/landing/home-hero.webp';
import { PRODUCT_SITE_DESCRIPTION } from '../content/productNorthStar';

export const SITE_NAME = 'UAE Trail';

export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN?.replace(/\/$/, '') ?? 'https://uaetrail.com';

export const SITE_DESCRIPTION = PRODUCT_SITE_DESCRIPTION;

/** Bundled hero — resolved by Vite in dev and `/assets/*` in production builds. */
export const HOME_HERO_IMAGE_WEBP = homeHeroWebp;
export const HOME_HERO_IMAGE_JPEG = homeHeroJpeg;

/** Stable public URL for Open Graph and API placeholders (copied from `public/` on build). */
export const HOME_HERO_OG_PATH =
  '/traveler-hiking-mountains-while-having-his-essentials-backpack-optimized.jpg';

export const toAbsoluteUrl = (pathOrUrl?: string | null): string | undefined => {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${path}`;
};

export const DEFAULT_OG_IMAGE = toAbsoluteUrl(HOME_HERO_OG_PATH)!;

export const DEFAULT_OG_IMAGE_ALT =
  'Group getting outdoors in the UAE — find your crew on UAE Trail';

export const pageTitle = (title: string): string =>
  title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
