import { ChevronRight } from 'lucide-react';
import type { ExploreCardModel } from '../exploreCardModel';
import { buildExploreListMeta, exploreCardToneTextClass } from '../exploreCardModel';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import { EnvironmentImage } from '../../components/ui/EnvironmentImage';
import { ExploreCardDetailList, ExploreCardLocationLink, ExploreCardRatingRow } from './ExploreCardPresentation';
import { ExploreCardTypeIcon } from './ExploreCardTypeIcon';
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
      className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200/75 bg-white p-3 text-left shadow-[0_1px_8px_rgba(15,23,42,.06)] ring-1 ring-black/[0.02] transition active:scale-[0.995] active:bg-neutral-50/80"
    >
      {card.coverImage ? (
        <div className="relative h-14 w-14 shrink-0">
          <EnvironmentImage
            src={card.coverImage}
            alt=""
            className="h-14 w-14 rounded-xl object-cover ring-1 ring-neutral-200/80"
            loading="lazy"
          />
          <span className="absolute -bottom-1 -right-1 shadow-sm ring-2 ring-white rounded-full">
            <ExploreCardTypeIcon tone={card.tone} source={card.source} kind={card.kind} size="overlay" />
          </span>
        </div>
      ) : (
        <ExploreCardTypeIcon tone={card.tone} source={card.source} kind={card.kind} size="sm" />
      )}

      <span className="min-w-0 flex-1">
        {highlightName ? (
          <p className="truncate text-[15px] font-bold leading-snug text-gray-900">
            <span>{highlightName}</span>
            {suffix && <span>{suffix}</span>}
            {activityHighlight && <span className={toneTextClass}>{activityHighlight}</span>}
            {dateHighlight && <span>{dateHighlight}</span>}
          </p>
        ) : (
          <p className="truncate text-[15px] font-bold leading-snug text-gray-900">{listTitle}</p>
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

      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
    </button>
  );
};
