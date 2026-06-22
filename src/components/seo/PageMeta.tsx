import { useEffect } from 'react';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  pageTitle,
  toAbsoluteUrl
} from '../../config/seo';

interface PageMetaProps {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  noIndex?: boolean;
}

const upsertMeta = (name: string, content: string, property = false): void => {
  const attr = property ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
};

/** Updates document title and core meta tags for SPA SEO. */
export function PageMeta({
  title,
  description,
  path,
  image,
  imageAlt,
  noIndex
}: PageMetaProps) {
  useEffect(() => {
    const fullTitle = pageTitle(title);
    document.title = fullTitle;

    const metaDescription = description ?? SITE_DESCRIPTION;
    upsertMeta('description', metaDescription);
    upsertMeta('og:description', metaDescription, true);
    upsertMeta('twitter:description', metaDescription);

    upsertMeta('og:title', fullTitle, true);
    upsertMeta('twitter:title', fullTitle);
    upsertMeta('og:site_name', SITE_NAME, true);
    upsertMeta('og:type', 'website', true);

    const canonicalPath = path ?? window.location.pathname;
    const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    upsertMeta('og:url', canonicalUrl, true);

    const ogImage = toAbsoluteUrl(image) ?? DEFAULT_OG_IMAGE;
    upsertMeta('og:image', ogImage, true);
    upsertMeta('twitter:image', ogImage);
    upsertMeta('og:image:alt', imageAlt ?? DEFAULT_OG_IMAGE_ALT, true);
    upsertMeta('twitter:image:alt', imageAlt ?? DEFAULT_OG_IMAGE_ALT);
    upsertMeta('twitter:card', 'summary_large_image');

    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noIndex) {
      if (!robots) {
        robots = document.createElement('meta');
        robots.name = 'robots';
        document.head.appendChild(robots);
      }
      robots.content = 'noindex, nofollow';
    } else if (robots) {
      robots.content = 'index, follow';
    }
  }, [title, description, path, image, imageAlt, noIndex]);

  return null;
}
