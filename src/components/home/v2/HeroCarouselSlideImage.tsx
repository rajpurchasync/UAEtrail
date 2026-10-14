import { useEffect, useRef, useState } from 'react';
import { MARKETING_HERO_LAYOUT_MIN_WIDTH_PX } from '../../../config/marketingHeroImages';
import type { HeroCarouselSlide } from './heroCarouselTypes';

const hiResClass = (hiResVisible: boolean, reducedMotion: boolean) =>
  [
    'home-hero-slide-image absolute inset-0 h-full w-full object-cover',
    hiResVisible ? 'opacity-100' : 'opacity-0',
    hiResVisible && !reducedMotion ? 'home-hero-slide-image--live' : ''
  ].join(' ');

const placeholderClass =
  'absolute inset-0 h-full w-full object-cover scale-[1.02] blur-[6px] brightness-[0.92]';

export const HeroCarouselSlideImage = ({
  slide,
  active,
  reducedMotion,
  loadFullResolution,
  onHiResReady
}: {
  slide: HeroCarouselSlide;
  active: boolean;
  reducedMotion: boolean;
  /** When false, only the LQIP placeholder is shown (saves bandwidth until slide is needed). */
  loadFullResolution: boolean;
  onHiResReady?: () => void;
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [hiResReady, setHiResReady] = useState(false);

  useEffect(() => {
    setHiResReady(false);
  }, [slide.id]);

  useEffect(() => {
    if (!loadFullResolution) return;
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setHiResReady(true);
    }
  }, [loadFullResolution, slide.id]);

  useEffect(() => {
    if (hiResReady) onHiResReady?.();
  }, [hiResReady, onHiResReady]);

  const showPlaceholder =
    active && !loadFullResolution && Boolean(slide.placeholderUrl) && !hiResReady;
  const showHiRes = loadFullResolution;

  const onHiResLoad = () => setHiResReady(true);

  const imgProps = {
    ref: imgRef,
    alt: active ? slide.alt : '',
    width: 1600,
    height: 900,
    sizes: '100vw',
    decoding: 'async' as const,
    loading: active ? ('eager' as const) : ('lazy' as const),
    fetchPriority: active ? ('high' as const) : ('low' as const),
    onLoad: onHiResLoad,
    className: hiResClass(hiResReady, reducedMotion),
    'aria-hidden': !active
  };

  const layout = slide.layoutSources;

  return (
    <div
      className={[
        'home-hero-slide absolute inset-0',
        active ? 'z-[1] opacity-100' : 'z-0 opacity-0'
      ].join(' ')}
      aria-hidden={!active}
    >
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
