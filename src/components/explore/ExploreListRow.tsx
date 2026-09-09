import { ChevronRight } from 'lucide-react';
import type { ExploreCardModel } from '../../explore/exploreCardModel';
import { buildExploreListMeta, exploreCardToneClass, exploreCardToneTextClass } from '../../explore/exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { EnvironmentImage } from '../ui/EnvironmentImage';
import { ExploreCardDetailList, ExploreCardLocationLink, ExploreCardRatingRow, ExploreCardTypeBadge } from './ExploreCardPresentation';
import type { MapFocusCoords } from './ExploreCardPresentation';

interface ExploreListRowProps {
  card: ExploreCardModel;
  item: ExploreMapItemDTO;
  onClick: () => void;
  onFocusMapLocation?: (coords: MapFocusCoords) => void;
}

export const ExploreListRow = ({ card, onClick, onFocusMapLocation }: ExploreListRowProps) => {
  const { listTitle, details, highlightName, suffix, activityHighlight, dateHighlight } = card.sections;
  const meta = buildExploreListMeta(card);
  const toneTextClass = exploreCardToneTextClass[card.tone];
  const isCatalogRow = card.source === 'shop' || card.source === 'agency' || card.source === 'venue';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-neutral-100 py-3.5 text-left transition-colors active:bg-emerald-500/[0.06] last:border-b-0"
    >
      {card.coverImage ? (
        <div className="relative h-14 w-14 shrink-0">
          <EnvironmentImage
            src={card.coverImage}
            alt=""
            className="h-14 w-14 rounded-xl object-cover ring-1 ring-neutral-200/80"
            loading="lazy"
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full font-emoji text-sm shadow-sm ring-2 ring-white ${exploreCardToneClass[card.tone]}`}
            aria-hidden
          >
            {card.emoji}
          </span>
        </div>
      ) : (
        <ExploreCardTypeBadge card={card} size="sm" />
      )}

      <span className="min-w-0 flex-1">
        {highlightName ? (
          <p className="truncate text-[16px] font-bold leading-snug text-gray-900">
            <span>{highlightName}</span>
            {suffix && <span>{suffix}</span>}
            {activityHighlight && <span className={toneTextClass}>{activityHighlight}</span>}
            {dateHighlight && <span>{dateHighlight}</span>}
          </p>
        ) : (
          <p className="truncate text-[16px] font-bold leading-snug text-gray-900">{listTitle}</p>
        )}
        {isCatalogRow ? (
          <>
            {card.subtitle ? (
              <div className="mt-1">
                <ExploreCardLocationLink
                  label={card.subtitle}
                  latitude={card.mapLatitude}
                  longitude={card.mapLongitude}
                  onFocusMap={onFocusMapLocation}
                  className="text-sm text-gray-600"
                />
              </div>
            ) : null}
            <ExploreCardRatingRow card={card} compact />
          </>
        ) : meta ? (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{meta}</p>
        ) : (
          <ExploreCardDetailList details={details} compact />
        )}
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
    </button>
  );
};
