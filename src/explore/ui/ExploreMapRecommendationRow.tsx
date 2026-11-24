import { Clock, MapPin } from 'lucide-react';
import type { DiscoverRecommendationSignal } from '@uaetrail/shared-types';
import type { DiscoveryCardModel } from '../../discovery/discoveryCardModel';
import { SecureAvatar } from '../../components/ui/SecureAvatar';
import { browseCardMeta, browseCardTitle, browseRowWhenDisplay } from '../../list/browse/browseCardMeta';
import { EXPLORE_TYPE } from '../../config/exploreTheme';
import { BROWSE_CARD_CHIP } from '../../list/browse/browseCardChrome';
import { MapPeekThumbColumn } from './peek/shared/MapPeekThumbColumn';
import { RecommendationSignalChips } from './RecommendationSignalChips';

type ExploreMapRecommendationRowProps = {
  card: DiscoveryCardModel;
  signals: DiscoverRecommendationSignal[];
  onOpen: () => void;
};

/** Compact horizontal browse card — same thumb + aside pattern as map peek. */
export const ExploreMapRecommendationRow = ({ card, signals, onOpen }: ExploreMapRecommendationRowProps) => {
  const meta = browseCardMeta(card);
  const title = browseCardTitle(card);
  const whenParts = browseRowWhenDisplay(card);
  const whenText =
    whenParts && (whenParts.date || whenParts.time)
      ? [whenParts.date, whenParts.time].filter(Boolean).join(' · ')
      : meta.when;

  const priceTone =
    meta.price === 'Free' ? 'bg-emerald-600 text-white' : meta.price ? 'bg-neutral-900 text-white' : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full gap-3 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-2 text-left shadow-[0_2px_12px_rgba(15,23,42,.08)] ring-1 ring-black/[0.04] transition active:scale-[0.99] active:bg-neutral-50"
      data-map-peek-media-aside
    >
      <MapPeekThumbColumn card={card} sizeClass="h-[4.75rem] w-[4.75rem]" />

      <span className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          {priceTone && meta.price ? (
            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${priceTone}`}>{meta.price}</span>
          ) : null}
          {meta.soldOut ? (
            <span className={`${BROWSE_CARD_CHIP} bg-rose-50 font-bold text-rose-800`}>Sold out</span>
          ) : null}
        </span>

        <span className={`line-clamp-2 text-[15px] font-bold leading-snug ${EXPLORE_TYPE.title}`}>{title}</span>

        {whenText ? (
          <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-emerald-800">
            <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{whenText}</span>
          </span>
        ) : null}

        {meta.location ? (
          <span className={`flex min-w-0 items-center gap-1 text-xs ${EXPLORE_TYPE.muted}`}>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
            <span className="truncate">{meta.location}</span>
          </span>
        ) : null}

        {meta.hostName ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <SecureAvatar
              src={meta.hostAvatar}
              name={meta.hostName}
              className="h-6 w-6 shrink-0 text-[11px] ring-2 ring-white"
            />
            <span className={`truncate text-[11px] font-medium ${EXPLORE_TYPE.muted}`}>{meta.hostName}</span>
          </span>
        ) : null}

        <RecommendationSignalChips signals={signals} />
      </span>
    </button>
  );
};