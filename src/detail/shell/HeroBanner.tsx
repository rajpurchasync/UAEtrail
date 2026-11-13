import type { ReactNode } from 'react';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import {
  DETAIL_HERO_MOBILE_TOP_CHROME_CLASS,
  DETAIL_HERO_MODAL_UNDERLAP_CLASS,
} from '../shared/detailHeroMobileTopChrome';

/**
 * Shared consumer-detail hero (plan §3.1).
 * Overlay copy uses logical inset (`inset-s-0`) so RTL mirrors without breaking LTR.
 */
export const HeroBanner = ({
  imageUrl,
  fallbackSrc,
  typeBadge,
  status,
  title,
  subtitle,
  dateBlock,
  chips,
  children,
  topEndAction,
  mobileTitleLayout = 'bottom',
  modalHeaderUnderlap = true,
}: {
  imageUrl?: string | null;
  fallbackSrc?: string;
  typeBadge?: ReactNode;
  status?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  dateBlock?: ReactNode;
  chips?: ReactNode;
  children?: ReactNode;
  /** Share — top-end overlay (matches photo strip). */
  topEndAction?: ReactNode;
  /** Matches `DetailHeroPhotoStrip` place layout — title block vertically centered on sub-lg. */
  mobileTitleLayout?: 'bottom' | 'center';
  modalHeaderUnderlap?: boolean;
}) => (
  <div
    className={`-mx-4 mb-3 max-w-[calc(100%+2rem)] min-w-0 overflow-hidden md:-mx-6 md:max-w-[calc(100%+3rem)] md:mb-4 md:mt-0 md:pt-0 lg:mx-0 lg:mb-3 lg:max-w-full${
      modalHeaderUnderlap ? ` ${DETAIL_HERO_MODAL_UNDERLAP_CLASS}` : ''
    }`}
    data-detail-hero-banner
  >
    <div className="relative h-[min(36dvh,300px)] max-md:min-h-[17.75rem] w-full overflow-hidden rounded-none md:h-[11.5rem] lg:h-[10.75rem] lg:min-h-0 lg:rounded-2xl">
      {topEndAction ? (
        <div className={DETAIL_HERO_MOBILE_TOP_CHROME_CLASS} data-detail-hero-top-actions>
          {topEndAction}
        </div>
      ) : null}
      {dateBlock ? (
        <div className="pointer-events-auto absolute bottom-3 end-3 z-20 lg:hidden" data-detail-hero-date-chip>
          {dateBlock}
        </div>
      ) : null}
      {imageUrl ? (
        <EnvironmentImage
          src={imageUrl}
          fallbackSrc={fallbackSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-neutral-900" />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20"
        aria-hidden
      />
      {mobileTitleLayout === 'center' ? (
        <div className="absolute inset-0 z-10 flex flex-col justify-center gap-2.5 px-4 pe-[7.5rem] pt-12 pb-6 text-white lg:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            {typeBadge}
            {status}
          </div>
          <h1 className="landing-hero-headline font-black leading-[1.18] [overflow-wrap:anywhere]">
            {title}
          </h1>
          {subtitle ? <div className="text-sm font-medium text-emerald-100/95">{subtitle}</div> : null}
          {chips ? <div>{chips}</div> : null}
          {children}
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 px-4 pb-4 text-white lg:hidden">
          <div className="flex flex-wrap items-center gap-1.5">
            {typeBadge}
            {status}
          </div>
          <h1 className="line-clamp-2 text-[1.55rem] font-bold leading-[1.2] tracking-tight">
            {title}
          </h1>
          {subtitle ? <div className="text-sm text-white/90">{subtitle}</div> : null}
          {chips ? <div>{chips}</div> : null}
          {children}
        </div>
      )}
      <div className="absolute inset-x-0 top-0 hidden grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] items-center gap-x-5 gap-y-2.5 px-6 pt-3 text-white lg:grid lg:gap-x-4 lg:gap-y-2 lg:px-4 lg:pt-2.5">
        <div className="col-start-1 row-start-1 flex min-w-0 flex-wrap items-center gap-1.5 self-start justify-self-stretch">
          {typeBadge}
          {status}
        </div>
        <h1 className="col-start-1 row-start-2 line-clamp-2 min-w-0 w-full self-start text-left text-[1.85rem] font-bold leading-[1.2] tracking-tight lg:text-[1.4rem]">
          {title}
        </h1>
        <div className="col-start-1 row-start-3 flex min-w-0 w-full flex-col items-start gap-1.5 self-start">
          {subtitle ? <div className="text-sm text-white/90">{subtitle}</div> : null}
          {chips ? <div>{chips}</div> : null}
          {children}
        </div>
        {topEndAction ? (
          <div className="col-start-2 row-start-1 flex justify-end self-center">{topEndAction}</div>
        ) : null}
        {dateBlock ? (
          <div className="col-start-2 row-start-2 flex justify-end self-center" data-detail-hero-date-chip>
            {dateBlock}
          </div>
        ) : null}
      </div>
    </div>
  </div>
);
