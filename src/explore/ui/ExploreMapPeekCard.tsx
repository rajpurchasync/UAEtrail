import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import { EXPLORE_PEEK } from '../../config/exploreTheme';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { ShareButton } from '../../components/ui/ShareButton';
import {
  ExploreCardDetailList,
  ExploreCardHeadline,
  ExploreCardRatingRow,
  ExploreCardTypeBadge,
  ExploreVenueImageBadges,
  type MapFocusCoords,
} from './ExploreCardPresentation';

interface ExploreMapPeekCardProps {
  card: ExploreCardModel;
  onClose: () => void;
  footer: ReactNode;
  children?: ReactNode;
  onFocusMapLocation?: (coords: MapFocusCoords) => void;
  /** Keep footer CTAs visible; scroll body only (desktop item sheet). */
  pinFooter?: boolean;
}

/** Unified floating peek card above map chrome — venues, activities, shops. */
export const ExploreMapPeekCard = ({
  card,
  onClose,
  footer,
  children,
  onFocusMapLocation,
  pinFooter = false,
}: ExploreMapPeekCardProps) => {
  const shellClass = pinFooter
    ? `${EXPLORE_PEEK.shell} lg:flex lg:max-h-[min(85vh,640px)] lg:min-h-0 lg:flex-col lg:overflow-hidden`
    : EXPLORE_PEEK.shell;

  return (
    <div className={shellClass}>
      {card.coverImage ? (
        <div
          className={`relative aspect-[2/1] w-full shrink-0 overflow-hidden bg-neutral-100${
            pinFooter ? ' lg:aspect-auto lg:max-h-[220px]' : ''
          }`}
        >
          <EnvironmentImage
            src={card.coverImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          <ExploreVenueImageBadges card={card} />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className={`flex shrink-0 items-start justify-between gap-3 px-4 ${card.coverImage ? 'pt-3' : 'pt-4'}`}>
        <ExploreCardTypeBadge card={card} size="sm" />
        <div className="flex items-center gap-1.5">
          <ShareButton
            title={card.shareTitle}
            text={card.shareText ?? undefined}
            path={card.sharePath}
            iconOnly
            light={!card.coverImage}
          />
          {!card.coverImage && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div
        className={
          pinFooter
            ? 'px-4 pt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain'
            : 'px-4 pt-3'
        }
      >
        <ExploreCardHeadline sections={card.sections} size="lg" tone={card.tone} />
        <ExploreCardRatingRow card={card} />
        <ExploreCardDetailList
          details={card.sections.details}
          compact
          mapLatitude={card.mapLatitude}
          mapLongitude={card.mapLongitude}
          onFocusMap={onFocusMapLocation}
        />
        {children}
      </div>

      <div
        className={
          pinFooter
            ? 'shrink-0 space-y-2 border-t border-neutral-100 px-4 py-3 pb-safe'
            : 'mt-3 space-y-2 border-t border-neutral-100 px-4 py-3 pb-safe'
        }
      >
        {footer}
      </div>
    </div>
  );
};

export const ExploreMapPeekPosition = ({ children }: { children: ReactNode }) => (
  <div className={EXPLORE_PEEK.position}>
    <div className={EXPLORE_PEEK.inner}>{children}</div>
  </div>
);
