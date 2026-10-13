import { MARKETING_HERO_LAYOUT_MIN_WIDTH_PX } from '../../../config/marketingHeroImages';
import type { HeroCarouselSlide } from './heroCarouselTypes';

const slideImageClass = (active: boolean, reducedMotion: boolean) =>
  [
    'absolute inset-0 h-full w-full object-cover',
    reducedMotion ? '' : 'transition-opacity duration-[var(--duration-carousel)] ease-[var(--ease-out)]',
    active ? 'opacity-100' : 'opacity-0'
  ].join(' ');

export const HeroCarouselSlideImage = ({
  slide,
  active,
  reducedMotion
}: {
  slide: HeroCarouselSlide;
  active: boolean;
  reducedMotion: boolean;
}) => {
  const imgProps = {
    alt: active ? slide.alt : '',
    width: 1600,
    height: 900,
    decoding: active ? ('sync' as const) : ('async' as const),
    loading: active ? ('eager' as const) : ('lazy' as const),
    fetchPriority: active ? ('high' as const) : ('auto' as const),
    className: slideImageClass(active, reducedMotion),
    'aria-hidden': !active
  };

  const layout = slide.layoutSources;
  if (layout) {
    const minWidth = layout.layoutMinWidthPx ?? MARKETING_HERO_LAYOUT_MIN_WIDTH_PX;
    const desktopMedia = `(min-width: ${minWidth}px)`;
    return (
      <picture className="absolute inset-0">
        {layout.desktop.webp ? (
          <source media={desktopMedia} type="image/webp" srcSet={layout.desktop.webp} />
        ) : null}
        <source media={desktopMedia} srcSet={layout.desktop.jpeg} />
        {layout.mobile.webp ? <source type="image/webp" srcSet={layout.mobile.webp} /> : null}
        <img src={layout.mobile.jpeg} {...imgProps} />
      </picture>
    );
  }

  return <img src={slide.imageUrl} srcSet={slide.imageSrcSet} {...imgProps} />;
};
