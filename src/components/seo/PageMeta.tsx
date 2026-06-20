import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}

const SITE = 'UAE Trail';

/** Updates document title and core meta tags for SPA SEO. */
export function PageMeta({ title, description, path, noIndex }: PageMetaProps) {
  useEffect(() => {
    document.title = title.includes(SITE) ? title : `${title} | ${SITE}`;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, true);
      setMeta('twitter:description', description);
    }

    setMeta('og:title', document.title, true);
    setMeta('twitter:title', document.title);

    const canonicalPath = path ?? window.location.pathname;
    const href = `${window.location.origin}${canonicalPath}`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = href;

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
  }, [title, description, path, noIndex]);

  return null;
}
