/** Guest `/` hero carousel — stable paths under `public/landing/hero/`. */

const heroBase = (key: string) => `/landing/hero/hero-${key}`;

export const marketingHeroResponsiveSlide = (
  key: string,
  alt: string
): { imageUrl: string; imageSrcSet: string; alt: string } => {
  const base = heroBase(key);
  return {
    imageUrl: `${base}-mobile.jpg`,
    imageSrcSet: `${base}-mobile.webp 1080w, ${base}-desktop.webp 1920w, ${base}-mobile.jpg 1080w, ${base}-desktop.jpg 1920w`,
    alt
  };
};
