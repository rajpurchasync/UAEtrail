import { useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { DiscoverRecommendationSignal, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { discoverRecommendationSignalLabel } from '../recommend/exploreRecommendationSignalCopy';
import { formatExploreRelativeScheduleLabel } from '@uaetrail/shared-types';
import { buildDiscoveryCardViewModelCard } from '../../discovery';
import {
  EXPLORE_MAP_RECOMMENDED_SUBTITLE,
  EXPLORE_MAP_RECOMMENDED_TITLE_GUEST,
  EXPLORE_MAP_RECOMMENDED_TITLE_SIGNED_IN,
} from '../recommend/exploreRecommendCopy';
import { EXPLORE_TYPE } from '../../config/exploreTheme';

export type ExploreMapRecommendedSheetSnap = 'hidden' | 'peek' | 'expanded';

type ExploreMapRecommendedSheetProps = {
  items: ExploreMapItemDTO[];
  signedIn: boolean;
  snap: ExploreMapRecommendedSheetSnap;
  onSnapChange: (snap: ExploreMapRecommendedSheetSnap) => void;
  onOpenItem: (itemId: string) => void;
  onOpenList?: () => void;
  signalsByItemId?: Map<string, DiscoverRecommendationSignal[]>;
};

const rowFromItem = (
  item: ExploreMapItemDTO,
  signalsByItemId?: Map<string, DiscoverRecommendationSignal[]>
) => {
  const card = buildDiscoveryCardViewModelCard(item);
  const when =
    item.startAt != null
      ? formatExploreRelativeScheduleLabel(item.startAt)
      : card.subtitle?.slice(0, 48) ?? null;
  const signals = signalsByItemId?.get(item.id) ?? [];
  return { id: item.id, emoji: card.emoji, title: card.listTitle, when, host: card.listHost, signals };
};

const RecommendationSignalChips = ({ signals }: { signals: DiscoverRecommendationSignal[] }) => {
  if (signals.length === 0) return null;
  return (
    <ul className="mt-1 flex flex-wrap gap-1" aria-label="Why recommended">
      {signals.slice(0, 3).map((signal) => (
        <li
          key={signal}
          className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80"
        >
          {discoverRecommendationSignalLabel(signal)}
        </li>
      ))}
    </ul>
  );
};

/**
 * Strava-style map bottom sheet — peek, expand, or hide (Discover recommendations v0).
 */
export const ExploreMapRecommendedSheet = ({
  items,
  signedIn,
  snap,
  onSnapChange,
  onOpenItem,
  onOpenList,
  signalsByItemId,
}: ExploreMapRecommendedSheetProps) => {
  const [dragHint, setDragHint] = useState(false);
  const title = signedIn ? EXPLORE_MAP_RECOMMENDED_TITLE_SIGNED_IN : EXPLORE_MAP_RECOMMENDED_TITLE_GUEST;
  const rows = items.map((item) => rowFromItem(item, signalsByItemId));
  const peekRow = rows[0];

  const close = useCallback(() => onSnapChange('hidden'), [onSnapChange]);
  const toggleExpand = useCallback(() => {
    onSnapChange(snap === 'expanded' ? 'peek' : 'expanded');
  }, [onSnapChange, snap]);

  if (snap === 'hidden' || rows.length === 0) {
    if (rows.length === 0) return null;
    return (
      <button
        type="button"
        onClick={() => onSnapChange('peek')}
        className="pointer-events-auto absolute bottom-[calc(var(--bottom-nav-chrome-height,56px)+var(--safe-bottom,0px)+8px)] left-1/2 z-[1095] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-800 shadow-lg ring-1 ring-emerald-200/80 md:bottom-4 md:left-6 md:translate-x-0"
      >
        {title}
      </button>
    );
  }

  const expanded = snap === 'expanded';

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-[calc(var(--bottom-nav-chrome-height,56px)+var(--safe-bottom,0px))] z-[1095] flex max-h-[min(52dvh,420px)] flex-col px-2 md:bottom-4 md:max-w-md md:px-0 md:pl-4"
      style={{
        maxHeight: expanded ? undefined : 'calc(7.75rem + var(--safe-bottom, 0px))',
      }}
    >
      <div
        className={`flex min-h-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-8px_32px_rgba(15,23,42,.12)] ring-1 ring-black/5 transition-[max-height] duration-200 md:rounded-2xl ${
          expanded ? 'flex-1' : ''
        }`}
        onTouchStart={() => setDragHint(true)}
        onTouchEnd={() => setDragHint(false)}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-neutral-100 px-3 py-2.5">
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col items-start text-left"
            onClick={toggleExpand}
            aria-expanded={expanded}
          >
            <span className="text-sm font-bold text-neutral-900">{title}</span>
            <span className={`text-[11px] ${EXPLORE_TYPE.muted}`}>{EXPLORE_MAP_RECOMMENDED_SUBTITLE}</span>
          </button>
          <button
            type="button"
            onClick={toggleExpand}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
            aria-label={expanded ? 'Collapse recommendations' : 'Expand recommendations'}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
            aria-label="Hide recommendations"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {expanded ? (
          <ul
            className={`min-h-0 flex-1 divide-y divide-neutral-100 overflow-y-auto overscroll-contain scroll-touch px-1 py-1 ${
              dragHint ? 'touch-pan-y' : ''
            }`}
          >
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-neutral-50"
                  onClick={() => onOpenItem(row.id)}
                >
                  <span className="text-lg" aria-hidden>
                    {row.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">{row.title}</span>
                    {row.when ? (
                      <span className={`block truncate text-xs ${EXPLORE_TYPE.muted}`}>{row.when}</span>
                    ) : null}
                    {row.host ? (
                      <span className={`block truncate text-[11px] ${EXPLORE_TYPE.muted}`}>{row.host}</span>
                    ) : null}
                    <RecommendationSignalChips signals={row.signals} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : peekRow ? (
          <button
            type="button"
            className="flex shrink-0 items-center gap-3 px-3 py-2.5 text-left active:bg-neutral-50"
            onClick={() => onOpenItem(peekRow.id)}
          >
            <span className="text-lg" aria-hidden>
              {peekRow.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-neutral-900">{peekRow.title}</span>
              {peekRow.when ? (
                <span className={`block truncate text-xs ${EXPLORE_TYPE.muted}`}>{peekRow.when}</span>
              ) : null}
              <RecommendationSignalChips signals={peekRow.signals} />
            </span>
          </button>
        ) : null}

        {expanded && onOpenList ? (
          <div className="shrink-0 border-t border-neutral-100 px-3 py-2">
            <button
              type="button"
              onClick={onOpenList}
              className="w-full rounded-xl bg-emerald-50 py-2 text-center text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80"
            >
              See all on list
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};