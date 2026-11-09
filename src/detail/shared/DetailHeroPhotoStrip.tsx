import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { HERO_CAROUSEL_AUTOPLAY_MS } from '../../components/home/marketing/heroCarouselTypes';
import { heroSlideShouldMount, stepCarouselIndex } from '../../utils/heroCarouselState';
import { detailHeroSourceLinkVisible, type DetailHeroPhoto } from './detailHeroPhotos';
import { DETAIL_HERO_MOBILE_TOP_CHROME_CLASS } from './detailHeroMobileTopChrome';

type DetailHeroPhotoStripProps = {
  photos: DetailHeroPhoto[];
  overlay?: ReactNode;
  className?: string;
  ariaLabel?: string;
  /** Share control — top-end of the hero (plan §3.1). */
  topEndAction?: ReactNode;
  /** Date chip, etc. — bottom-end of the hero. */
  bottomEndOverlay?: ReactNode;
  /** Place/venue heroes — title block vertically centered below top actions on sub-lg viewports. */
  mobileOverlayLayout?: 'stacked-bottom' | 'centered';
  /** Current page path — source chip is shown only for child / linked entities (not this page). */
  selfDetailPath?: string;
  /** Outing detail — venue line covers the trail; skip bottom TRAIL·… chip (default on). */
  showLinkedPhotoSourceLink?: boolean;
};

const DetailHeroPhotoTrailLink = ({ photo }: { photo: DetailHeroPhoto }) => (
  <Link
    to={photo.href}
    className="flex w-full max-w-[9.25rem] items-center gap-1 overflow-hidden rounded-lg border border-white/25 bg-white/10 py-0.5 ps-1.5 pe-2 text-white backdrop-blur-sm transition hover:border-white/35 hover:bg-white/15 lg:max-w-[min(100%,16rem)] lg:gap-1.5 lg:py-1 lg:ps-2 lg:pe-2.5"
    aria-label={`${photo.kindLabel}: ${photo.title}. Open details`}
  >
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/20 lg:h-6 lg:w-6">
      <Info className="h-2.5 w-2.5 text-white/90 lg:h-3 lg:w-3" strokeWidth={2.1} aria-hidden />
    </span>
    <span className="min-w-0 truncate text-[11px] font-semibold leading-tight text-white">
      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/75">
        {photo.kindLabel}
      </span>
      <span className="px-1 text-white/45" aria-hidden>
        ·
      </span>
      <span className="font-medium">{photo.title}</span>
    </span>
  </Link>
);

/** Consumer detail hero: up to five photos, share top-right, source link on the right. */
export const DetailHeroPhotoStrip = ({
  photos,
  overlay,
  className = '',
  ariaLabel = 'Photos',
  topEndAction,
  bottomEndOverlay,
  mobileOverlayLayout = 'stacked-bottom',
  selfDetailPath,
  showLinkedPhotoSourceLink = true,
}: DetailHeroPhotoStripProps) => {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [hiResReady, setHiResReady] = useState(false);
  const total = photos.length;
  const current = total > 0 ? photos[Math.min(index, total - 1)] : null;
  const photoSignature = photos.map((photo) => photo.src).join('|');
  const hasTopChrome = Boolean(topEndAction);
  const showSourceLink = Boolean(
    showLinkedPhotoSourceLink &&
      current &&
      detailHeroSourceLinkVisible(current.href, selfDetailPath)
  );
  const hasBottomChrome = Boolean(bottomEndOverlay || showSourceLink);
  const mobileTitleCentered = mobileOverlayLayout === 'centered';

  useEffect(() => {
    setIndex(0);
    setHiResReady(false);
  }, [photoSignature]);

  useEffect(() => {
    if (total <= 1 || reducedMotion) return;
    const fallback = window.setTimeout(() => setHiResReady(true), 900);
    return () => window.clearTimeout(fallback);
  }, [photoSignature, total, reducedMotion]);

  useEffect(() => {
    if (total <= 1 || reducedMotion || !hiResReady) return;
    const timer = window.setInterval(() => {
      setIndex((currentIndex) => stepCarouselIndex(currentIndex, total, 1));
    }, HERO_CAROUSEL_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [total, reducedMotion, hiResReady]);

  if (total === 0 && !overlay) return null;

  const mobileBottomChrome = (
    <>
      {bottomEndOverlay}
      {showSourceLink && current && !mobileTitleCentered ? (
        <DetailHeroPhotoTrailLink photo={current} />
      ) : null}
    </>
  );

  return (
    <section
      aria-label={ariaLabel}
      className={`relative flex h-[min(31dvh,252px)] max-md:min-h-[14.75rem] w-full max-w-full flex-col overflow-hidden bg-home-ink ${
        mobileTitleCentered ? '' : 'max-lg:justify-end'
      } md:h-[11.5rem] lg:h-[10.75rem] lg:min-h-0 lg:justify-normal lg:rounded-2xl ${className}`}
      data-detail-hero-photo-strip
    >
      <div className="absolute inset-0 z-0" aria-hidden>
        {photos.map((photo, slideIndex) => {
          if (!heroSlideShouldMount(slideIndex, index) && slideIndex !== index) return null;
          const active = slideIndex === index;
          return (
            <div
              key={`${photo.href}:${photo.src}`}
              className={`home-hero-slide absolute inset-0 ${active ? 'z-[1] opacity-100' : 'z-0 opacity-0'}`}
            >
              <EnvironmentImage
                src={photo.src}
                alt={active ? photo.title : ''}
                className={`home-hero-slide-image absolute inset-0 h-full w-full object-cover object-center ${
                  active && hiResReady && !reducedMotion ? 'home-hero-slide-image--live' : ''
                }`}
                loading={active ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => {
                  if (active) setHiResReady(true);
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[2] md:hidden"
        style={{ background: 'var(--hero-overlay-mobile)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] hidden md:block"
        style={{ background: 'var(--hero-overlay)' }}
        aria-hidden
      />

      {topEndAction ? (
        <div className={DETAIL_HERO_MOBILE_TOP_CHROME_CLASS} data-detail-hero-top-actions>
          {topEndAction}
        </div>
      ) : null}

      {hasBottomChrome && !mobileTitleCentered ? (
        <div className="absolute end-3 bottom-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2 max-md:max-w-[46%] lg:hidden">
          {mobileBottomChrome}
        </div>
      ) : null}

      {mobileTitleCentered && showSourceLink && current ? (
        <div className="absolute end-3 bottom-3 z-20 flex max-w-[9.75rem] flex-col items-end gap-2 lg:hidden">
          <DetailHeroPhotoTrailLink photo={current} />
        </div>
      ) : null}

      {overlay ? (
        <>
          {mobileTitleCentered ? (
            <div className="pointer-events-none absolute inset-0 z-10 flex w-full items-center justify-between gap-3 px-4 pe-3 pb-4 pt-11 text-white lg:hidden">
              <div className="home-hero-copy pointer-events-auto flex min-w-0 max-w-[calc(100%-5.25rem)] flex-col items-stretch justify-center gap-4 text-left">
                {overlay}
              </div>
              {bottomEndOverlay ? (
                <div className="pointer-events-auto flex shrink-0 flex-col items-end justify-center gap-2 self-center">
                  {bottomEndOverlay}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="relative z-10 w-full min-w-0 text-white lg:absolute lg:inset-0 lg:flex lg:flex-col lg:justify-start lg:pt-2.5">
              <div
                className={`home-hero-copy flex w-full min-w-0 flex-col items-start gap-3 px-4 text-left max-lg:gap-3.5 max-lg:pe-[7.5rem] lg:hidden ${
                  hasBottomChrome ? 'pb-14 max-lg:pb-[6.25rem]' : 'pb-3'
                } ${hasTopChrome ? 'max-lg:pt-2' : ''}`}
              >
                {overlay}
              </div>
            </div>
          )}
          <div className="home-hero-copy absolute inset-0 z-10 hidden w-full min-w-0 text-white lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto_auto] lg:items-center lg:gap-x-4 lg:gap-y-2 lg:px-4 lg:pt-2.5">
            <div className="col-start-1 row-start-1 row-end-4 flex w-full min-w-0 flex-col items-start justify-center gap-2 text-left lg:gap-2.5">
              {overlay}
            </div>
            {topEndAction ? (
              <div className="col-start-2 row-start-1 flex justify-end self-center">{topEndAction}</div>
            ) : null}
            {bottomEndOverlay ? (
              <div className="col-start-2 row-start-2 flex justify-end self-center">{bottomEndOverlay}</div>
            ) : null}
            {showSourceLink && current ? (
              <div className="col-start-2 row-start-3 flex justify-end self-center">
                <DetailHeroPhotoTrailLink photo={current} />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
};
