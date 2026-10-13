import { useEffect, useState } from 'react';
import { MARKETING_HERO_LAYOUT_MIN_WIDTH_PX } from '../../../config/marketingHeroImages';
import type { HeroCarouselSlide } from './heroCarouselTypes';

const slideImageClass = (active: boolean, reducedMotion: boolean, hiResVisible: boolean) =>
  [
    'absolute inset-0 h-full w-full object-cover',
    reducedMotion ? '' : 'transition-opacity duration-500 ease-out',
    active && hiResVisible ? 'opacity-100' : 'opacity-0'
  ].join(' ');

const placeholderClass =
  'absolute inset-0 h-full w-full object-cover scale-[1.02] blur-[6px] brightness-[0.92]';

export const HeroCarouselSlideImage = ({
  slide,
  active,
  reducedMotion,
  loadFullResolution
}: {
  slide: HeroCarouselSlide;
  active: boolean;
  reducedMotion: boolean;
  /** When false, only the LQIP placeholder is shown (saves bandwidth until slide is needed). */
  loadFullResolution: boolean;
}) => {
  const [hiResReady, setHiResReady] = useState(false);

  useEffect(() => {
    setHiResReady(false);
  }, [slide.id, loadFullResolution]);

  const showPlaceholder = Boolean(slide.placeholderUrl);
  const showHiRes = loadFullResolution;

  const imgProps = {
    alt: active ? slide.alt : '',
    width: 1600,
    height: 900,
    decoding: active ? ('sync' as const) : ('async' as const),
    loading: 'eager' as const,
    fetchPriority: active ? ('high' as const) : ('low' as const),
    onLoad: () => setHiResReady(true),
    className: slideImageClass(active, reducedMotion, hiResReady),
    'aria-hidden': !active
  };

  const layout = slide.layoutSources;

  return (
    <div className="absolute inset-0 bg-home-ink" aria-hidden={!active}>
      {showPlaceholder ? (
        <img
          src={slide.placeholderUrl}
          alt=""
          aria-hidden
          width={48}
          height={27}
          decoding="sync"
          fetchPriority={active ? 'high' : 'auto'}
          className={placeholderClass}
        />
      ) : null}

      {showHiRes && layout ? (
        (() => {
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
        })()
      ) : null}

      {showHiRes && !layout ? (
        <img src={slide.imageUrl} srcSet={slide.imageSrcSet} {...imgProps} />
      ) : null}
    </div>
  );
};
