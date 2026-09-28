import { useEffect } from 'react';
import { HOME_HERO_IMAGE_WEBP } from '../../config/seo';

/** Preload LCP hero only on guest `/` — avoids unused preload on /explore and signed-in redirects. */
export const HomeHeroPreload = () => {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = HOME_HERO_IMAGE_WEBP;
    link.type = 'image/webp';
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);
  return null;
};
