/** Central SEO constants — keep brand and URLs consistent across meta, schema, and llms.txt */

export const SITE_NAME = 'UAE Trail';

export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN?.replace(/\/$/, '') ?? 'https://uaetrail.ae';

export const SITE_DESCRIPTION =
  'Discover hiking trails, camping spots, and organized outdoor trips across the UAE and GCC with verified guides.';

/** Self-hosted hero — hiking in the mountains (matches page topic; better than generic city skyline for SEO/OG) */
export const HOME_HERO_IMAGE = '/traveler-hiking-mountains-while-having-his-essentials-backpack.jpg';

export const toAbsoluteUrl = (pathOrUrl?: string | null): string | undefined => {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${path}`;
};

export const DEFAULT_OG_IMAGE = toAbsoluteUrl(HOME_HERO_IMAGE)!;

export const DEFAULT_OG_IMAGE_ALT = 'Hiker with backpack on a mountain trail — outdoor adventure in the UAE';

export const pageTitle = (title: string): string =>
  title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
